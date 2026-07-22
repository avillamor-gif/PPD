# AI Policy Comparison Setup Guide

## What's New

Added an AI-powered policy comparison feature that lets users compare multiple policies side-by-side with AI analysis.

### Features Implemented:

1. **Search Page Enhancements**
   - ✅ Checkboxes added to each policy row
   - ✅ Floating "Compare Selected Policies" button appears when 2+ policies are selected
   - ✅ Users can select/deselect policies for comparison

2. **Comparison API Endpoint**
   - ✅ `/api/compare-policies` - POST endpoint that:
     - Fetches selected policies from database
     - Sends them to OpenAI's GPT-4 for analysis
     - Returns structured comparison

3. **Comparison Results Page**
   - ✅ `/policies/compare` - Dedicated page that displays:
     - Selected policies being compared
     - AI-generated analysis with:
       - Key Differences
       - Similarities
       - Effectiveness Assessment
       - Implementation Approach
       - Geographic Context

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api/keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key

### 2. Add Environment Variable

1. Open `.env.local` in your project root
2. Add this line:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual OpenAI API key

### 3. Verify Setup

Run your development server:
```bash
npm run dev
```

Navigate to the search page at `http://localhost:3000/search`

### 4. Test the Feature

1. Select 2 or more policies using the checkboxes
2. Click the floating "Compare X Policies" button at the bottom
3. Wait for the AI analysis to generate
4. Review the comparison results on `/policies/compare`

## Cost Considerations

- Each comparison uses OpenAI's GPT-4o model
- Estimated cost: ~$0.05-0.10 per comparison
- Monitor usage at [OpenAI Usage](https://platform.openai.com/usage)

## Troubleshooting

### "Failed to generate policy comparison"
- Check that `OPENAI_API_KEY` is set correctly in `.env.local`
- Verify your OpenAI account has available credits
- Check that at least 2 policies are selected

### Missing comparison section
- Ensure the API endpoint `/api/compare-policies` is working
- Check browser console for errors
- Verify the selected policy IDs are valid

### Slow response
- OpenAI API can take 10-30 seconds
- Check network tab for API timeout
- Consider retrying the comparison

## Files Changed

- `app/search/page.tsx` - Added selection checkboxes and comparison button
- `app/api/compare-policies/route.ts` - New API endpoint for AI comparison
- `app/policies/compare/page.tsx` - New comparison results page
- `package.json` - Added `openai` dependency

## Future Enhancements

- Add more comparison options (e.g., effectiveness scoring)
- Cache comparison results
- Add export/download functionality for comparisons
- Support for 3+ policy comparisons with visual diff
- Historical comparison tracking
