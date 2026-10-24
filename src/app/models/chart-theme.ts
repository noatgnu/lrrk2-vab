import type { Data, Layout } from 'plotly.js-dist-min';
import { ActivityGroup } from './activity';

export type ColorScheme = 'light' | 'dark';

export interface Figure {
  data: Data[];
  layout: Partial<Layout>;
}

/**
 * Builds a chart figure in the given palette, or returns null when there is nothing to draw yet.
 */
export type FigureBuilder = (palette: ChartPalette) => Figure | null;

/**
 * Colours used by the Plotly charts for one colour scheme. Plotly cannot read CSS variables,
 * so charts take these values from `Theme.palette()` and redraw when the scheme changes.
 */
export interface ChartPalette {
  scheme: ColorScheme;
  ink: string;
  secondary: string;
  subdued: string;
  muted: string;
  axis: string;
  grid: string;
  markerOutline: string;
  barFill: string;
  barOutline: string;
  boxFill: string;
  panel: string;
  hoverBg: string;
  control: string;
  domain: Record<string, string>;
  domainInk: Record<string, string>;
  group: Record<ActivityGroup, string>;
  groupInk: Record<ActivityGroup, string>;
}

const DOMAIN_FILLS: Record<string, string> = {
  ARM: '#7b2f8e',
  ANK: '#232f7e',
  LRR: '#6f9bd6',
  ROC: '#12814a',
  'COR-A': '#f3e0a0',
  'COR-B': '#f6c919',
  KIN: '#f0901f',
  WD40: '#c23a37',
};

export const LIGHT_PALETTE: ChartPalette = {
  scheme: 'light',
  ink: '#0b0b0b',
  secondary: '#52514e',
  subdued: '#6b6a66',
  muted: '#898781',
  axis: '#c3c2b7',
  grid: '#e1e0d9',
  markerOutline: 'rgba(11,11,11,0.45)',
  barFill: '#d9d8d3',
  barOutline: '#8a8984',
  boxFill: 'rgba(255,255,255,0.85)',
  panel: '#f0efec',
  hoverBg: '#fcfcfb',
  control: '#5b5a56',
  domain: DOMAIN_FILLS,
  domainInk: {
    ARM: '#7b2f8e',
    ANK: '#232f7e',
    LRR: '#4a78b8',
    ROC: '#12814a',
    'COR-A': '#8a7a3c',
    'COR-B': '#a07f00',
    KIN: '#c66d00',
    WD40: '#c23a37',
  },
  group: { above_reference: '#e34948', wt_range: '#b5b4ae', reduced: '#5b8fd9' },
  groupInk: { above_reference: '#c4302f', wt_range: '#8a8984', reduced: '#3f74c2' },
};

export const DARK_PALETTE: ChartPalette = {
  scheme: 'dark',
  ink: '#f0efec',
  secondary: '#c3c2b7',
  subdued: '#9a9993',
  muted: '#898781',
  axis: '#4a4a46',
  grid: '#2c2c2a',
  markerOutline: 'rgba(240,239,236,0.4)',
  barFill: '#3a3a37',
  barOutline: '#6d6c67',
  boxFill: 'rgba(26,26,25,0.85)',
  panel: '#2a2a28',
  hoverBg: '#262624',
  control: '#a8a79f',
  domain: { ...DOMAIN_FILLS, ARM: '#9a4fae', ANK: '#4d5bc0' },
  domainInk: {
    ARM: '#c98bd9',
    ANK: '#9aa5ef',
    LRR: '#9dbdf0',
    ROC: '#4fc184',
    'COR-A': '#e9d48e',
    'COR-B': '#f2cf4a',
    KIN: '#f5a85a',
    WD40: '#ec7a77',
  },
  group: { above_reference: '#e66767', wt_range: '#62615c', reduced: '#3987e5' },
  groupInk: { above_reference: '#f08a89', wt_range: '#a8a79f', reduced: '#8db6f0' },
};

/**
 * Layout settings shared by every chart: transparent background, fonts, hover labels and mode bar in the palette's colours.
 */
export function baseLayout(palette: ChartPalette): Partial<Layout> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Roboto, system-ui, sans-serif', size: 11, color: palette.ink },
    hoverlabel: {
      bgcolor: palette.hoverBg,
      bordercolor: palette.axis,
      font: { family: 'Roboto, system-ui, sans-serif', size: 11, color: palette.ink },
    },
    modebar: { bgcolor: 'rgba(0,0,0,0)', color: palette.muted, activecolor: palette.ink },
  };
}
