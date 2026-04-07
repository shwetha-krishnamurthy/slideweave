import React, { useState, useEffect } from 'react';
import { analyzeSlideImage } from '../utils/imageAnalysis';
import { refineSlide } from '../utils/slideRefinement';

const STEPS = [
  { id: 'scanning',  label: 'Scanning slide for images...' },
  { id: 'fetching',  label: 'Fetching image data...' },
  { id: 'analyzing', label: 'Analyzing with Claude Vision...' },
  { id: 'creating',  label: 'Building editable slide...' },
  { id: 'refining',  label: 'Refining layout...' },
];

function StepIcon({ step, currentStepId }) {
  const order = STEPS.map(s => s.id);
  const currentIdx = order.indexOf(currentStepId);
  const stepIdx = order.indexOf(step.id);
  if (stepIdx < currentIdx) return <span className="me-step-icon done">✓</span>;
  if (stepIdx === currentIdx) return <span className="me-step-icon current">⟳</span>;
  return <span className="me-step-icon pending">○</span>;
}

function MakeEditableView({ presentationId, currentSlideId, autoScan, onAutoScanDone }) {
  const [status, setStatus] = useState('idle');
  const [images, setImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [refineStatus, setRefineStatus] = useState(null);

  useEffect(() => {
    if (autoScan && status === 'idle') {
      scanSlide();
      onAutoScanDone?.();
    }
  }, [autoScan]); // null | {cycle, total, phase, issues}

  const scanSlide = async () => {
    if (!presentationId) {
      setErrorMsg('No presentation loaded. Open a Google Slides presentation first.');
      setStatus('error');
      return;
    }

    setStatus('scanning');
    setErrorMsg('');
    setImages([]);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SLIDE_IMAGES',
        data: { presentationId, slideId: currentSlideId }
      });

      if (!response.success) throw new Error(response.error);

      if (response.images.length === 0) {
        setErrorMsg('No images found on this slide. Navigate to a slide with a Nano Banana Pro generated image and try again.');
        setStatus('error');
        return;
      }

      setImages(response.images);
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const makeEditable = async (image) => {
    setProcessingId(image.objectId);
    setErrorMsg('');

    try {
      // Step 1: fetch image as base64
      setStatus('fetching');
      const fetchResp = await chrome.runtime.sendMessage({
        type: 'FETCH_IMAGE_AS_BASE64',
        data: { imageUrl: image.contentUrl }
      });
      if (!fetchResp.success) throw new Error(fetchResp.error);

      // Step 2: analyze with Claude Vision
      setStatus('analyzing');
      const analysis = await analyzeSlideImage(fetchResp.base64, fetchResp.mimeType);

      // Step 3: create the new editable slide
      setStatus('creating');
      const createResp = await chrome.runtime.sendMessage({
        type: 'CREATE_EDITABLE_SLIDE',
        data: {
          presentationId,
          requests: analysis.requests,
          title: analysis.title
        }
      });
      if (!createResp.success) throw new Error(createResp.error);

      // Step 4: refinement loop
      setStatus('refining');
      await refineSlide(presentationId, createResp.slideId, (progress) => {
        setRefineStatus(progress);
      });

      setNewSlideTitle(analysis.title);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    } finally {
      setProcessingId(null);
    }
  };

  const reset = () => {
    setStatus('idle');
    setImages([]);
    setErrorMsg('');
    setNewSlideTitle('');
    setProcessingId(null);
  };

  if (status === 'done') {
    return (
      <div className="make-editable-view">
        <div className="me-success">
          <div className="me-success-icon">✓</div>
          <h3>Editable Slide Created!</h3>
          <p className="me-success-title">{newSlideTitle}</p>
          <p className="me-hint">
            A new editable slide has been added to the end of your presentation.
            All text, shapes, and colors are fully editable.
          </p>
          <button className="me-btn-primary" onClick={reset}>Convert Another</button>
        </div>
      </div>
    );
  }

  const isProcessing = STEPS.some(s => s.id === status);

  return (
    <div className="make-editable-view">
      <div className="me-header">
        <h2>Make Editable</h2>
        <p className="me-description">
          Convert a Nano Banana Pro generated image into a fully editable slide —
          real text boxes, shapes, and colors you can modify.
        </p>
      </div>

      {isProcessing && (
        <div className="me-progress">
          {STEPS.map(step => {
            const currentIdx = STEPS.findIndex(s => s.id === status);
            const stepIdx = STEPS.findIndex(s => s.id === step.id);
            const isDone = stepIdx < currentIdx;
            const isCurrent = step.id === status;

            // Dynamic label for the refining step
            let label = step.label;
            if (step.id === 'refining' && isCurrent && refineStatus) {
              const { cycle, total, phase } = refineStatus;
              if (phase === 'reviewing') label = `Reviewing layout (cycle ${cycle}/${total})...`;
              else if (phase === 'fixing') label = `Applying fixes (cycle ${cycle}/${total})...`;
              else if (phase === 'clean') label = `Layout looks good — stopped early`;
              else label = `Refinement complete (${total} cycles)`;
            }

            return (
              <div
                key={step.id}
                className={`me-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
              >
                <StepIcon step={step} currentStepId={status} />
                <span>{label}</span>
              </div>
            );
          })}

          {/* Show issues found during current refinement cycle */}
          {status === 'refining' && refineStatus?.issues?.length > 0 && (
            <div className="me-refine-issues">
              <p className="me-refine-issues-label">Issues found:</p>
              {refineStatus.issues.map((issue, i) => (
                <p key={i} className="me-refine-issue">• {issue}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="me-error">
          <p>{errorMsg}</p>
          <button className="me-btn-secondary" onClick={reset}>Try Again</button>
        </div>
      )}

      {!isProcessing && status !== 'error' && images.length === 0 && (
        <div className="me-scan-prompt">
          <div className="me-scan-icon">🖼️</div>
          <p>Navigate to a slide containing a Nano Banana Pro image, then scan to detect it.</p>
          <button
            className="me-btn-primary"
            onClick={scanSlide}
            disabled={!presentationId}
          >
            Scan Current Slide
          </button>
          {!presentationId && (
            <p className="me-hint">Open a Google Slides presentation first.</p>
          )}
        </div>
      )}

      {!isProcessing && images.length > 0 && (
        <div className="me-images">
          <p className="me-found-label">
            Found {images.length} image{images.length !== 1 ? 's' : ''} on this slide:
          </p>
          {images.map((img, i) => {
            const widthIn = Math.round((img.width / 914400) * 10) / 10;
            const heightIn = Math.round((img.height / 914400) * 10) / 10;
            return (
              <div key={img.objectId} className="me-image-card">
                <div className="me-image-info">
                  <span className="me-image-icon">🖼️</span>
                  <div>
                    <div className="me-image-label">Image {i + 1}</div>
                    <div className="me-image-size">{widthIn}" × {heightIn}"</div>
                  </div>
                </div>
                <button
                  className="me-btn-primary me-btn-small"
                  onClick={() => makeEditable(img)}
                  disabled={processingId !== null}
                >
                  Make Editable
                </button>
              </div>
            );
          })}
          <button className="me-btn-secondary me-rescan" onClick={scanSlide}>
            Rescan Slide
          </button>
        </div>
      )}
    </div>
  );
}

export default MakeEditableView;
