import type { CustomBlockDefinition } from '@/lib/visual-editor/registry';

/**
 * Register custom block types for this website.
 *
 * Example:
 *
 *   import { PricingTable } from '@/components/custom/PricingTable';
 *
 *   export const customBlocks: CustomBlockDefinition[] = [
 *     {
 *       manifest: {
 *         type: 'pricing-table',
 *         label: 'Pricing Table',
 *         icon: 'payments',
 *         category: 'Custom',
 *         description: 'Display pricing tiers',
 *         inputs: [
 *           { name: 'title', label: 'Title', type: 'string', defaultValue: 'Pricing' },
 *           { name: 'columns', label: 'Columns', type: 'enum', enumOptions: [
 *             { label: '2', value: '2' },
 *             { label: '3', value: '3' },
 *           ]},
 *         ],
 *         defaultProps: { title: 'Pricing', columns: '3' },
 *       },
 *       component: PricingTable,
 *     },
 *   ];
 */
export const customBlocks: CustomBlockDefinition[] = [];
