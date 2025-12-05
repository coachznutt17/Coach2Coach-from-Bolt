// SEO utilities for Coach2Coach platform
import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noindex?: boolean;
}

// Build Next.js metadata object
export function buildMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    canonical,
    image,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    keywords,
    noindex = false
  } = config;

  const fullTitle = title.includes('Coach2Coach') ? title : `${title} | Coach2Coach`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : undefined;
  const fullImage = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/og-default.png`;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(', '),
    robots: noindex ? 'noindex,nofollow' : 'index,follow',
    canonical: fullCanonical,
    openGraph: {
      title: fullTitle,
      description,
      url: fullCanonical,
      siteName: 'Coach2Coach',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      type,
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: '@Coach2CoachNet'
    },
    alternates: {
      canonical: fullCanonical
    }
  };
}

// Generate JSON-LD structured data
export function generateProductSchema(resource: {
  id: string;
  title: string;
  description: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  image?: string;
  coach: {
    name: string;
    title: string;
  };
}): object {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: resource.title,
    description: resource.description,
    image: resource.image || `${baseUrl}/og-default.png`,
    brand: {
      '@type': 'Brand',
      name: 'Coach2Coach'
    },
    offers: {
      '@type': 'Offer',
      price: resource.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: resource.coach.name,
        jobTitle: resource.coach.title
      }
    },
    aggregateRating: resource.rating && resource.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: resource.rating.toString(),
      reviewCount: resource.reviewCount.toString(),
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    category: 'Coaching Resources',
    audience: {
      '@type': 'Audience',
      audienceType: 'Coaches'
    }
  };
}

// Generate Article schema for spotlights/stories
export function generateArticleSchema(article: {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  modifiedAt?: string;
  author: {
    name: string;
    title: string;
  };
  image?: string;
}): object {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    articleBody: article.content,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.title
    },
    publisher: {
      '@type': 'Organization',
      name: 'Coach2Coach',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    image: article.image || `${baseUrl}/og-default.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': baseUrl
    }
  };
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): object {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

// Generate Organization schema
export function generateOrganizationSchema(): object {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Coach2Coach',
    alternateName: 'Coach2Coach Network',
    description: 'The premier digital marketplace where coaching expertise meets opportunity.',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/Coach2CoachNet',
      'https://facebook.com/Coach2CoachNetwork',
      'https://linkedin.com/company/coach2coach-network'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-678-343-5084',
      contactType: 'customer service',
      email: 'zach@coach2coachnetwork.com'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Atlanta',
      addressRegion: 'GA',
      addressCountry: 'US'
    }
  };
}

// SEO utilities for dynamic pages
export class SEOManager {
  private static instance: SEOManager;
  private cache: Map<string, any> = new Map();

  static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  async getPageSEO(path: string): Promise<SEOConfig | null> {
    try {
      // Check cache first
      if (this.cache.has(path)) {
        return this.cache.get(path);
      }

      // Fetch from database
      if (supabase) {
        const { data, error } = await supabase
          .from('seo_pages')
          .select('*')
          .eq('path', path)
          .single();

        if (!error && data) {
          const seoConfig: SEOConfig = {
            title: data.title,
            description: data.description,
            canonical: data.canonical_url || path,
            keywords: data.keywords || [],
            noindex: data.robots?.includes('noindex') || false
          };
          
          this.cache.set(path, seoConfig);
          return seoConfig;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching page SEO:', error);
      return null;
    }
  }

  async updatePageSEO(path: string, config: Partial<SEOConfig>): Promise<void> {
    try {
      if (supabase) {
        await supabase
          .from('seo_pages')
          .upsert({
            path,
            title: config.title,
            description: config.description,
            keywords: config.keywords || [],
            canonical_url: config.canonical,
            robots: config.noindex ? 'noindex,nofollow' : 'index,follow',
            last_modified: new Date().toISOString()
          });
      }

      // Update cache
      this.cache.set(path, config);
    } catch (error) {
      console.error('Error updating page SEO:', error);
    }
  }

  generateSitemap(pages: Array<{ path: string; lastModified?: string; priority?: number; changeFreq?: string }>): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
    
    const urls = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastModified || new Date().toISOString()}</lastmod>
    <changefreq>${page.changeFreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }
}

export const seoManager = SEOManager.getInstance();