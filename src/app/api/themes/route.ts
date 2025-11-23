/**
 * GET /api/themes
 * 
 * Retrieve available themes for store customization
 * 
 * @requires Authentication
 * @returns List of available themes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Mock theme data - TODO: Move to database or external theme registry
const themes = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern default theme',
    previewImage: '/themes/default-preview.jpg',
    isPremium: false,
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#0070f3',
      background: '#ffffff',
      text: '#000000',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    features: ['responsive', 'accessible', 'dark-mode'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sleek and minimalist design',
    previewImage: '/themes/modern-preview.jpg',
    isPremium: false,
    colors: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#ff6b6b',
      background: '#f8f8f8',
      text: '#1a1a1a',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Roboto',
    },
    features: ['responsive', 'accessible', 'animations'],
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional e-commerce layout',
    previewImage: '/themes/classic-preview.jpg',
    isPremium: false,
    colors: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      accent: '#e74c3c',
      background: '#ecf0f1',
      text: '#2c3e50',
    },
    fonts: {
      heading: 'Merriweather',
      body: 'Open Sans',
    },
    features: ['responsive', 'sidebar-navigation'],
  },
  {
    id: 'premium-dark',
    name: 'Premium Dark',
    description: 'Luxury dark theme with gold accents',
    previewImage: '/themes/premium-dark-preview.jpg',
    isPremium: true,
    colors: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      accent: '#ffd700',
      background: '#0f0f0f',
      text: '#ffffff',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
    },
    features: ['responsive', 'accessible', 'dark-mode', 'animations', 'premium-components'],
  },
  {
    id: 'boutique',
    name: 'Boutique',
    description: 'Elegant theme for fashion and lifestyle brands',
    previewImage: '/themes/boutique-preview.jpg',
    isPremium: true,
    colors: {
      primary: '#f5e6d3',
      secondary: '#d4af7a',
      accent: '#8b7355',
      background: '#ffffff',
      text: '#3e3e3e',
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Montserrat',
    },
    features: ['responsive', 'accessible', 'image-gallery', 'lookbook'],
  },
];

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isPremium = searchParams.get('premium');

    // Filter themes based on query
    let filteredThemes = themes;
    if (isPremium === 'true') {
      filteredThemes = themes.filter(theme => theme.isPremium);
    } else if (isPremium === 'false') {
      filteredThemes = themes.filter(theme => !theme.isPremium);
    }

    return NextResponse.json({
      success: true,
      data: filteredThemes,
      count: filteredThemes.length,
    });
  } catch (error) {
    console.error('[GET /api/themes] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}
