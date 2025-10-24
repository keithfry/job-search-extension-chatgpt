# Chrome Web Store Submission Checklist

Use this checklist to ensure you're ready to submit ChatGPT Custom Prompts to the Chrome Web Store.

## Phase 1: Pre-Submission Preparation

### Documentation ✅
- [x] Privacy policy created (`PRIVACY.md`)
- [x] Permissions justification documented (`PERMISSIONS_JUSTIFICATION.md`)
- [x] Store listing content drafted (`STORE_LISTING.md`)
- [ ] Privacy policy hosted publicly (GitHub or website)

### Extension Files ✅
- [x] Manifest.json updated with better description
- [x] All icons present (16, 24, 48, 128px)
- [x] LICENSE file included
- [x] Build script created (`build.sh`)

### Assets to Create 📸
- [ ] Take 4-5 screenshots (see `SCREENSHOT_GUIDE.md`)
  - [ ] Extension options page
  - [ ] Context menu in action
  - [ ] Actions management
  - [ ] ChatGPT integration
  - [ ] Keyboard shortcuts (optional)
- [ ] Resize all screenshots to 1280×800 px
- [ ] Create small tile promotional image (440×280 px) - optional but recommended
- [ ] Create marquee promotional image (1400×560 px) - optional

### Testing 🧪
- [ ] Build extension package: `./build.sh`
- [ ] Load ZIP as unpacked extension in Chrome
- [ ] Test all features:
  - [ ] Custom actions work
  - [ ] Context menu appears
  - [ ] Keyboard shortcuts function
  - [ ] Options page saves correctly
  - [ ] Import/Export works
  - [ ] ChatGPT integration successful
- [ ] Test on clean Chrome profile (no other extensions)
- [ ] Verify no console errors

## Phase 2: Chrome Web Store Account Setup

### Developer Account 💳
- [ ] Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
- [ ] Sign in with Google account
- [ ] Pay $5 one-time developer registration fee
- [ ] Complete account setup
- [ ] Add support email address

### Important Notes:
- Registration fee is one-time, not recurring
- Account approval can take a few minutes to hours
- Use a professional email address for support contact

## Phase 3: Upload & Configure

### Upload Extension 📦
- [ ] Build final ZIP package: `./build.sh`
- [ ] Click "New Item" in Developer Dashboard
- [ ] Upload `chatgpt-custom-prompts-v2.0.3.zip`
- [ ] Wait for upload to complete and initial validation

### Store Listing - Basic Info 📝
- [ ] **Extension name:** ChatGPT Custom Prompts
- [ ] **Summary:** (Copy from `STORE_LISTING.md` - Short Description)
- [ ] **Detailed description:** (Copy from `STORE_LISTING.md` - Detailed Description)
- [ ] **Category:** Productivity
- [ ] **Language:** English

### Store Listing - Assets 🖼️
- [ ] Upload icon (128×128) - already in ZIP, but may need to select it
- [ ] Upload screenshots (4-5 images, 1280×800 each)
  - [ ] Add caption for each screenshot
- [ ] Upload small tile (440×280) - optional
- [ ] Upload marquee (1400×560) - optional

### Store Listing - Links & Contact 🔗
- [ ] **Homepage URL:** https://github.com/keithfry/chatgpt-query-extension
- [ ] **Support URL:** https://github.com/keithfry/chatgpt-query-extension/issues
- [ ] **Privacy Policy URL:** https://github.com/keithfry/chatgpt-query-extension/blob/main/PRIVACY.md
- [ ] **Support email:** [Your email]

### Distribution Settings 🌍
- [ ] **Visibility:** Public
- [ ] **Regions:** All regions (or select specific countries)
- [ ] **Pricing:** Free

### Privacy Practices 🔒
- [ ] Review and answer all privacy practice questions
- [ ] Confirm no data collection
- [ ] Link to privacy policy
- [ ] Explain permissions usage

**Key Privacy Questions:**
- ✅ "Does not collect user data" - YES (select this)
- Justify `<all_urls>` permission (paste from `PERMISSIONS_JUSTIFICATION.md`)
- Explain all permissions clearly

## Phase 4: Permissions Justification

When asked about `<all_urls>` permission, use this response:

```
The extension uses a content script with <all_urls> permission exclusively for
keyboard shortcuts functionality.

The lightweight keyboard listener must be available on all websites to allow
users to trigger custom ChatGPT prompts via keyboard shortcuts from any webpage
(job boards, documentation, emails, social media, etc.).

The content script:
- Only listens for configured keyboard shortcuts
- Does not read page content or collect any data
- Only sends a message to the background script when a shortcut is pressed
- Is minimal (~100 lines) and fully auditable in our open source repository

Full justification: https://github.com/keithfry/chatgpt-query-extension/blob/main/PERMISSIONS_JUSTIFICATION.md
```

## Phase 5: Review & Submit

### Pre-Submit Review ✨
- [ ] Preview extension listing
- [ ] Check all screenshots display correctly
- [ ] Verify description formatting
- [ ] Test all links (privacy policy, support, homepage)
- [ ] Proofread all text for typos
- [ ] Confirm pricing is "Free"
- [ ] Check category is correct

### Final Submission 🚀
- [ ] Click "Submit for Review"
- [ ] Confirm submission
- [ ] Save your submission number/confirmation

### Review Process ⏳
- [ ] Wait for review (typically 1-3 business days)
- [ ] Monitor email for reviewer questions or feedback
- [ ] Respond promptly to any reviewer requests
- [ ] Address any issues flagged by reviewers

## Phase 6: Post-Submission

### If Approved ✅
- [ ] Celebrate! 🎉
- [ ] Share link to Chrome Web Store listing
- [ ] Update README.md with install badge
- [ ] Tweet about it / share on social media (optional)
- [ ] Monitor reviews and ratings
- [ ] Respond to user feedback

### If Rejected ❌
- [ ] Read rejection reason carefully
- [ ] Address all issues mentioned
- [ ] Update extension files if needed
- [ ] Re-package with `./build.sh`
- [ ] Resubmit with explanation of changes

### Common Rejection Reasons & Fixes:
1. **Permission justification unclear**
   - Solution: Use detailed explanation from `PERMISSIONS_JUSTIFICATION.md`

2. **Privacy policy not accessible**
   - Solution: Ensure GitHub link works and PRIVACY.md is public

3. **Screenshots don't show functionality**
   - Solution: Retake screenshots following `SCREENSHOT_GUIDE.md`

4. **Description too vague**
   - Solution: Use detailed description from `STORE_LISTING.md`

5. **<all_urls> permission flagged**
   - Solution: Provide specific keyboard shortcuts justification

## Ongoing Maintenance

### After Approval 🎯
- [ ] Monitor user reviews regularly
- [ ] Respond to support emails promptly
- [ ] Fix bugs reported by users
- [ ] Plan future updates
- [ ] Update privacy policy if functionality changes

### For Updates 🔄
- [ ] Increment version number in manifest.json
- [ ] Update CHANGELOG or release notes
- [ ] Run `./build.sh` to create new package
- [ ] Upload new version to Developer Dashboard
- [ ] Add "What's new in this version" notes
- [ ] Submit update for review

## Important Reminders ⚠️

1. **Privacy Policy Must Be Publicly Accessible**
   - GitHub link works great: https://github.com/keithfry/chatgpt-query-extension/blob/main/PRIVACY.md
   - Make sure repo is public (not private)

2. **Response Time Matters**
   - Reviewers may ask questions via email
   - Respond within 7 days to avoid rejection
   - Check email regularly during review period

3. **Screenshots Are Critical**
   - Must show actual extension functionality
   - Should be professional quality
   - Must be exactly 1280×800 or 640×400 pixels

4. **Permissions Justification**
   - Be specific about why each permission is needed
   - Reference specific code/functionality
   - Link to open source code for transparency

5. **First Submission Takes Longest**
   - Initial review: 1-3 days (sometimes up to 7)
   - Updates typically faster (1-2 days)
   - Be patient during first submission

## Resources

- **Chrome Web Store Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Developer Program Policies:** https://developer.chrome.com/docs/webstore/program-policies/
- **Best Practices:** https://developer.chrome.com/docs/webstore/best-practices/
- **Review Process:** https://developer.chrome.com/docs/webstore/review-process/

## Support Email Template

When users contact you for support, use this template:

```
Hi [Name],

Thank you for using ChatGPT Custom Prompts!

[Answer their question]

If you're experiencing issues:
1. Check the extension options page for configuration
2. Ensure your Custom GPT URL is correct
3. Try reloading the extension (chrome://extensions → Reload)
4. Review the README: https://github.com/keithfry/chatgpt-query-extension

Feel free to open an issue on GitHub if problems persist:
https://github.com/keithfry/chatgpt-query-extension/issues

Thanks,
[Your name]
```

---

## Quick Reference

**Build Command:** `./build.sh`

**Output File:** `chatgpt-custom-prompts-v2.0.3.zip`

**Privacy Policy:** https://github.com/keithfry/chatgpt-query-extension/blob/main/PRIVACY.md

**Support:** https://github.com/keithfry/chatgpt-query-extension/issues

---

**Remember:** Take your time with the submission. Quality over speed. A well-prepared submission is more likely to be approved on the first try!

Good luck! 🚀
