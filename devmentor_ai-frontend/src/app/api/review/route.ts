import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'Code Review App',
  },
});

export async function POST(request: NextRequest) {
  console.log('🚀 STARTING AI CODE REVIEW - OPENROUTER VERSION');
  
  try {
    const { code, language, title, description } = await request.json();
    console.log('📝 Code received:', { 
      codeLength: code.length, 
      language, 
      title: title || 'No title provided'
    });

    if (!code || code.trim().length === 0) {
      console.log('❌ No code provided');
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🔑 OpenRouter API Key status:', !!apiKey);
    
    if (!apiKey) {
      console.log('❌ No OpenRouter API key found');
      return NextResponse.json({
        error: 'OpenRouter API key not configured. Please add your API key to use AI code review.',
        message: 'Set OPENAI_API_KEY in your environment variables'
      }, { status: 500 });
    }

    console.log('🤖 Calling OpenRouter API...');

    try {
      const completion = await openai.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `Please review this ${language} code and provide feedback on bugs, performance, security, and best practices:

Title: ${title || 'Code Review'}
Description: ${description || 'No description provided'}

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide detailed feedback including:
1. Any bugs or issues you find
2. Performance improvements
3. Security concerns
4. Code style and best practices
5. Overall assessment`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      console.log('✅ OpenRouter API call successful');
      
      const reviewContent = completion.choices[0]?.message?.content;
      
      if (!reviewContent) {
        throw new Error('No response content received from API');
      }

      console.log('📄 Review content received, length:', reviewContent.length);

      return NextResponse.json({
        success: true,
        review: reviewContent,
        metadata: {
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          provider: 'OpenRouter',
          timestamp: new Date().toISOString(),
          codeLength: code.length,
          language: language
        }
      });

    } catch (apiError: any) {
      console.error('❌ OpenRouter API Error:', apiError);
      
      // Handle specific OpenRouter/OpenAI API errors
      let errorMessage = 'API request failed';
      let statusCode = 503;
      
      if (apiError.status) {
        statusCode = apiError.status;
        
        switch (apiError.status) {
          case 400:
            errorMessage = 'Invalid request - please check your code input';
            break;
          case 401:
            errorMessage = 'API key is invalid or expired';
            break;
          case 403:
            errorMessage = 'Access forbidden - check your API key permissions';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded - please wait and try again';
            break;
          case 500:
            errorMessage = 'OpenRouter server error - please try again later';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'OpenRouter service temporarily unavailable';
            break;
          default:
            errorMessage = `API error (${apiError.status}): ${apiError.message || 'Unknown error'}`;
        }
      } else if (apiError.code) {
        switch (apiError.code) {
          case 'ENOTFOUND':
          case 'ECONNREFUSED':
            errorMessage = 'Network connection failed - check your internet connection';
            break;
          case 'ETIMEDOUT':
            errorMessage = 'Request timed out - please try again';
            break;
          default:
            errorMessage = `Connection error: ${apiError.code}`;
        }
      } else {
        errorMessage = apiError.message || 'Unknown API error occurred';
      }

      return NextResponse.json({
        error: 'OpenRouter API Error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? apiError.message : undefined,
        timestamp: new Date().toISOString()
      }, { status: statusCode });
    }

  } catch (error: any) {
    console.error('💥 General Error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        message: 'Please check your request format'
      }, { status: 400 });
    }
    
    // Handle other general errors
    return NextResponse.json({
      error: 'Server Error',
      message: 'An unexpected error occurred. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}