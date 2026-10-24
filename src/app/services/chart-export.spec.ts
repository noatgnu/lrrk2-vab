import { TestBed } from '@angular/core/testing';
import { PlotlyService } from 'angular-plotly.js';
import { ChartPalette, DARK_PALETTE, Figure, LIGHT_PALETTE } from '../models/chart-theme';
import { ChartExport, EXPORT_BACKGROUND } from './chart-export';

interface DownloadButton {
  name: string;
  click: (graph: HTMLElement) => void;
}

describe('ChartExport', () => {
  let service: ChartExport;
  let downloadImage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    downloadImage = vi.fn().mockResolvedValue('');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PlotlyService,
          useValue: { getPlotly: () => Promise.resolve({ downloadImage }) },
        },
      ],
    });
    service = TestBed.inject(ChartExport);
  });

  function build(palette: ChartPalette): Figure {
    return { data: [], layout: { height: 300, font: { color: palette.ink } } };
  }

  it('replaces the image button with an SVG download button', () => {
    const config = service.config('chart', build);
    const buttons = config.modeBarButtonsToAdd as unknown as DownloadButton[];

    expect(config.modeBarButtonsToRemove).toContain('toImage');
    expect(config.showSendToCloud).toBe(false);
    expect(buttons.map((b) => b.name)).toEqual(['downloadSvg']);
  });

  it('downloads the light-palette figure on a white background as SVG', async () => {
    const graph = { clientWidth: 900, clientHeight: 280 } as HTMLElement;
    const seen: ChartPalette[] = [];

    await service.download(graph, 'chart', (palette) => {
      seen.push(palette);
      return build(palette);
    });

    expect(seen).toEqual([LIGHT_PALETTE]);
    expect(downloadImage).toHaveBeenCalledWith(
      {
        data: [],
        layout: {
          height: 300,
          font: { color: LIGHT_PALETTE.ink },
          paper_bgcolor: EXPORT_BACKGROUND,
          plot_bgcolor: EXPORT_BACKGROUND,
        },
      },
      { format: 'svg', filename: 'chart', width: 900, height: 300 },
    );
    expect(LIGHT_PALETTE.ink).not.toBe(DARK_PALETTE.ink);
  });

  it('skips the download when there is no figure yet', async () => {
    await service.download({} as HTMLElement, 'chart', () => null);

    expect(downloadImage).not.toHaveBeenCalled();
  });
});
