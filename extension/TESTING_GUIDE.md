# SlideWeave - Testing Guide

## Manual Testing Checklist

### Phase 1: Extension Loading ✓

- [ ] Extension loads in Chrome without errors
- [ ] Extension icon appears in toolbar
- [ ] No console errors in `chrome://extensions/`
- [ ] Clicking extension popup shows welcome message

**How to test:**
1. Go to `chrome://extensions/`
2. Load unpacked from `dist/` folder
3. Check for errors
4. Click extension icon in toolbar

### Phase 2: Sidebar Injection ✓

- [ ] Sidebar appears when opening Google Slides
- [ ] Sidebar is positioned on the right side
- [ ] Sidebar has proper styling (gradient header, tabs)
- [ ] Google Slides content adjusts for sidebar
- [ ] Sidebar persists when switching slides

**How to test:**
1. Open any Google Slides presentation
2. Look for SlideWeave sidebar on right
3. Switch between slides
4. Verify sidebar remains visible

### Phase 3: Settings Panel ✓

- [ ] Settings panel shows on first open (no API key)
- [ ] Can enter Claude API key
- [ ] Can save API key
- [ ] Saved key is masked when re-opened
- [ ] Settings accessible from gear icon

**How to test:**
1. Fresh install → should show settings
2. Enter API key: `sk-ant-api-...`
3. Click "Save API Key"
4. Reload page
5. Settings should show masked key

### Phase 4: Chat Interface ✓

- [ ] Chat tab is default view
- [ ] Empty state shows welcome message
- [ ] Can type in input field
- [ ] Can submit with Enter or button
- [ ] Loading indicator appears during AI call
- [ ] Messages appear in chat history

**How to test:**
1. After setting API key, go to Chat tab
2. Type: "make the title red"
3. Press Enter or click send button
4. Watch for loading spinner
5. Check for AI response

### Phase 5: Claude Integration ✓

- [ ] Claude API is called with user prompt
- [ ] AI generates suggestion JSON
- [ ] Description appears in chat
- [ ] Suggestion card displays properly
- [ ] Error handling for invalid API key
- [ ] Error handling for API failures

**How to test:**
1. Enter valid prompt
2. Check console for API call
3. Verify JSON response structure
4. Try with invalid API key
5. Check error messages

### Phase 6: Suggestion Workflow ✓

- [ ] Suggestion card appears after AI response
- [ ] "Apply" button is present
- [ ] "Dismiss" button is present
- [ ] Clicking Apply attempts to execute
- [ ] Clicking Dismiss marks as dismissed
- [ ] Status saved to Chrome storage

**How to test:**
1. Generate a suggestion
2. Click "Apply" (may fail without OAuth)
3. Click "Dismiss" on another
4. Check Chrome storage:
   - Open DevTools
   - Application → Storage → Local Storage
   - Look for suggestion_ keys

### Phase 7: Suggestions Tab ✓

- [ ] Suggestions tab shows pending items
- [ ] Empty state when no suggestions
- [ ] Pending suggestions listed
- [ ] Can apply from suggestions tab
- [ ] Can dismiss from suggestions tab
- [ ] Bulk actions work (Apply All, Dismiss All)

**How to test:**
1. Create 2-3 suggestions
2. Switch to Suggestions tab
3. Verify all pending shown
4. Try individual apply/dismiss
5. Test bulk actions

### Phase 8: OAuth Flow (Advanced)

- [ ] Can authenticate with Google
- [ ] OAuth token obtained
- [ ] Token used for API calls
- [ ] Token refresh works
- [ ] Error handling for denied access

**How to test:**
Requires Google Cloud setup:
1. Configure OAuth in manifest
2. Load extension
3. Trigger auth flow
4. Check background console for token

### Phase 9: Google Slides API (Advanced)

- [ ] Can read presentation data
- [ ] Can execute batchUpdate
- [ ] Changes reflect in Google Slides
- [ ] Error handling for API failures
- [ ] Rate limiting handled

**How to test:**
Requires OAuth setup:
1. Generate suggestion
2. Click Apply
3. Check if slide actually changes
4. Verify in Google Slides

### Phase 10: Performance ✓

- [ ] Sidebar loads quickly (<1s)
- [ ] No memory leaks
- [ ] Smooth scrolling in chat
- [ ] React renders efficiently
- [ ] No infinite loops

**How to test:**
1. Open DevTools → Performance
2. Record interaction
3. Check for red flags
4. Monitor memory usage

### Phase 11: Error Handling ✓

- [ ] Invalid API key shows clear error
- [ ] Network failures handled gracefully
- [ ] Malformed AI responses caught
- [ ] OAuth errors displayed
- [ ] No uncaught exceptions

**How to test:**
1. Try invalid API key
2. Disconnect internet mid-request
3. Send ambiguous prompts
4. Check console for errors

## Integration Testing

### Scenario 1: First Time User

1. Install extension
2. Open Google Slides
3. See settings panel
4. Enter API key
5. See chat interface
6. Send first message
7. Receive suggestion
8. Apply suggestion

**Expected:** Smooth onboarding, no errors

### Scenario 2: Regular Usage

1. Open Google Slides
2. Chat already has API key
3. Send multiple prompts
4. Generate several suggestions
5. Apply some, dismiss others
6. Check Suggestions tab
7. Use bulk actions

**Expected:** Efficient workflow, persistent state

### Scenario 3: Error Recovery

1. Enter invalid API key
2. See error message
3. Go to Settings
4. Fix API key
5. Return to Chat
6. Send prompt successfully

**Expected:** Clear error, easy recovery

## Browser Testing

Test in different scenarios:

- [ ] Chrome (primary)
- [ ] With other extensions enabled
- [ ] With ad blockers
- [ ] In incognito mode
- [ ] After browser restart

## Console Checks

**What to look for:**

Browser Console (F12):
```
[SlideWeave] Initializing on presentation page
[SlideWeave] Sidebar injected
```

Extension Background (Inspect service worker):
```
[SlideWeave Background] Service worker initialized
[SlideWeave] OAuth token obtained
[SlideWeave] Presentation data loaded
```

Sidebar Console (Right-click sidebar → Inspect):
```
[SlideWeave Sidebar] Initializing React app
[SlideWeave] API key status: true
```

## Known Limitations (MVP)

These are expected:

- Comments don't actually appear in Google Slides (Drive API needed)
- OAuth requires manual Google Cloud setup
- Icons are placeholders
- Single presentation only (no multi-tab support)
- No real-time sync between users

## Success Criteria

MVP is successful when:

1. ✅ Extension loads without errors
2. ✅ Sidebar appears in Google Slides
3. ✅ Can save Claude API key
4. ✅ Can chat with AI
5. ✅ AI generates suggestions
6. ✅ Suggestions can be applied/dismissed
7. ✅ State persists across reloads
8. ✅ No critical bugs in core flow

## Debugging Tips

**Sidebar not appearing:**
```javascript
// Check content script loaded
console.log('[SlideWeave] Content script status');
```

**API calls failing:**
```javascript
// Check network tab in DevTools
// Look for calls to api.anthropic.com
```

**State issues:**
```javascript
// Inspect Chrome storage
chrome.storage.sync.get(null, console.log);
chrome.storage.local.get(null, console.log);
```

**React errors:**
```javascript
// Check sidebar console
// Look for red React error messages
```

## Test Data

Example prompts to try:

1. "make the title red"
2. "increase font size to 48"
3. "make the title bold"
4. "change the subtitle text"
5. "move the text box down"
6. "add a new bullet point about climate"

## Performance Benchmarks

Target metrics:

- Sidebar load: <1 second
- AI response: 2-5 seconds (depends on Claude API)
- Apply action: <1 second
- Storage operations: <100ms

## Next Steps After Testing

Once MVP testing passes:

1. Add screenshots to README
2. Record demo video
3. Write Chrome Web Store description
4. Create privacy policy
5. Submit for review

Happy testing!
