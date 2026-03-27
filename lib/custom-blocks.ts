import type { CustomBlockDefinition } from '@/lib/visual-editor/registry';
import { CustomHero } from '@/components/custom/CustomHero';

export const customBlocks: CustomBlockDefinition[] = [
  {
    manifest: {
      type: 'custom-hero',
      label: 'Hero Section',
      icon: 'view_carousel',
      category: 'Custom',
      description: 'Full-width hero with heading, subheading, CTA buttons, and background image',
      inputs: [
        { name: 'heading', label: 'Heading', type: 'string', defaultValue: 'Welcome to Our Site' },
        { name: 'subheading', label: 'Subheading', type: 'string', defaultValue: 'Build something amazing with our platform' },
        { name: 'ctaText', label: 'Primary Button Text', type: 'string', defaultValue: 'Get Started' },
        { name: 'ctaUrl', label: 'Primary Button URL', type: 'url', defaultValue: '#' },
        { name: 'secondaryCtaText', label: 'Secondary Button Text', type: 'string', defaultValue: '' },
        { name: 'secondaryCtaUrl', label: 'Secondary Button URL', type: 'url', defaultValue: '#' },
        { name: 'backgroundImage', label: 'Background Image', type: 'image', defaultValue: '' },
        { name: 'overlayColor', label: 'Overlay Color', type: 'color', defaultValue: '#000000' },
        {
          name: 'overlayOpacity', label: 'Overlay Opacity', type: 'enum',
          enumOptions: [
            { label: 'None', value: '0' },
            { label: 'Light (0.3)', value: '0.3' },
            { label: 'Medium (0.5)', value: '0.5' },
            { label: 'Heavy (0.7)', value: '0.7' },
            { label: 'Very Heavy (0.85)', value: '0.85' },
          ],
        },
        { name: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff' },
        {
          name: 'alignment', label: 'Text Alignment', type: 'enum',
          enumOptions: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        {
          name: 'minHeight', label: 'Min Height', type: 'enum',
          enumOptions: [
            { label: 'Small (400px)', value: '400px' },
            { label: 'Medium (600px)', value: '600px' },
            { label: 'Large (800px)', value: '800px' },
            { label: 'Full Screen', value: '100vh' },
          ],
        },
      ],
      defaultProps: {
        heading: 'Welcome to Our Site',
        subheading: 'Build something amazing with our platform',
        ctaText: 'Get Started',
        ctaUrl: '#',
        secondaryCtaText: 'Learn More',
        secondaryCtaUrl: '#',
        backgroundImage: '',
        overlayColor: '#000000',
        overlayOpacity: '0.5',
        textColor: '#ffffff',
        alignment: 'center',
        minHeight: '600px',
      },
    },
    component: CustomHero,
  },
];
