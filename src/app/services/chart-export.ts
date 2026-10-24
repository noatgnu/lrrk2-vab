import { inject, Service } from '@angular/core';
import { PlotlyService } from 'angular-plotly.js';
import type { Config, ModeBarDefaultButtons } from 'plotly.js-dist-min';
import { FigureBuilder, LIGHT_PALETTE } from '../models/chart-theme';

export const EXPORT_BACKGROUND = '#ffffff';
const FALLBACK_WIDTH = 1200;

const DOWNLOAD_ICON = {
  width: 24,
  height: 24,
  path: 'M5 20h14v-2H5v2zm7-18v10.17l-3.59-3.58L7 10l5 5 5-5-1.41-1.41L13 12.17V2h-2z',
};

/**
 * Builds Plotly configs whose download button always exports an SVG in the light palette on a
 * white background, independent of the theme shown on screen.
 */
@Service()
export class ChartExport {
  private readonly plotly = inject(PlotlyService);

  /**
   * Returns the shared chart config: no Plotly logo or "Share chart" button, responsive sizing, and a
   * light-theme SVG download button replacing Plotly's own image button.
   */
  config(
    filename: string,
    build: FigureBuilder,
    removeButtons: ModeBarDefaultButtons[] = ['select2d', 'lasso2d'],
    overrides: Partial<Config> = {},
  ): Partial<Config> {
    return {
      displaylogo: false,
      showSendToCloud: false,
      responsive: true,
      modeBarButtonsToRemove: [...removeButtons, 'toImage'],
      modeBarButtonsToAdd: [
        {
          name: 'downloadSvg',
          title: 'Download plot as SVG',
          icon: DOWNLOAD_ICON,
          click: (graph: HTMLElement) => void this.download(graph, filename, build),
        },
      ],
      ...overrides,
    };
  }

  /**
   * Rebuilds the figure in the light palette at the on-screen size and downloads it as an SVG.
   */
  async download(graph: HTMLElement, filename: string, build: FigureBuilder): Promise<void> {
    const figure = build(LIGHT_PALETTE);
    if (!figure) {
      return;
    }
    const plotly = await this.plotly.getPlotly();
    await plotly.downloadImage(
      {
        data: figure.data,
        layout: {
          ...figure.layout,
          paper_bgcolor: EXPORT_BACKGROUND,
          plot_bgcolor: EXPORT_BACKGROUND,
        },
      },
      {
        format: 'svg',
        filename,
        width: graph.clientWidth || FALLBACK_WIDTH,
        height: figure.layout.height ?? graph.clientHeight,
      },
    );
  }
}
