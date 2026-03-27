'use client';

interface CustomHeroProps {
  block: {
    heading?: string;
    subheading?: string;
    ctaText?: string;
    ctaUrl?: string;
    secondaryCtaText?: string;
    secondaryCtaUrl?: string;
    backgroundImage?: string;
    overlayColor?: string;
    overlayOpacity?: string;
    textColor?: string;
    alignment?: string;
    minHeight?: string;
    layout?: string;
  };
}

export function CustomHero({ block }: CustomHeroProps) {
  const {
    heading = 'Welcome to Our Site',
    subheading = 'Build something amazing with our platform',
    ctaText = 'Get Started',
    ctaUrl = '#',
    secondaryCtaText = '',
    secondaryCtaUrl = '#',
    backgroundImage = '',
    overlayColor = '#000000',
    overlayOpacity = '0.5',
    textColor = '#ffffff',
    alignment = 'center',
    minHeight = '600px',
    layout = 'centered',
  } = block;

  const alignClass =
    alignment === 'left' ? 'items-start text-left' :
    alignment === 'right' ? 'items-end text-right' :
    'items-center text-center';

  const layoutClass =
    layout === 'split' ? 'max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6' :
    'max-w-3xl mx-auto px-6';

  return (
    <section
      className={`relative flex justify-center ${alignClass} overflow-hidden`}
      style={{
        minHeight,
        color: textColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: parseFloat(overlayOpacity),
          }}
        />
      )}

      {/* Gradient fallback when no image */}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
      )}

      <div className={`relative z-10 flex flex-col justify-center w-full h-full py-20 ${alignClass}`} style={{ minHeight }}>
        <div className={layoutClass}>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              {heading}
            </h1>
            {subheading && (
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl" style={alignment === 'center' ? { margin: '0 auto 2rem' } : undefined}>
                {subheading}
              </p>
            )}
            <div className={`flex flex-wrap gap-4 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''}`}>
              {ctaText && (
                <a
                  href={ctaUrl}
                  className="inline-flex items-center px-8 py-3.5 rounded-lg text-base font-semibold transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: textColor, color: backgroundImage ? overlayColor : '#1e40af' }}
                >
                  {ctaText}
                </a>
              )}
              {secondaryCtaText && (
                <a
                  href={secondaryCtaUrl}
                  className="inline-flex items-center px-8 py-3.5 rounded-lg text-base font-semibold border-2 transition-all hover:scale-105"
                  style={{ borderColor: textColor, color: textColor }}
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
