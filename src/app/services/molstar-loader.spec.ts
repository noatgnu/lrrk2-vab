import { TestBed } from '@angular/core/testing';
import { MOLSTAR_SCRIPT, MOLSTAR_STYLES, MolstarLoader } from './molstar-loader';
import { Theme } from './theme';

describe('MolstarLoader', () => {
  let loader: MolstarLoader;

  beforeEach(() => {
    localStorage.clear();
    document
      .querySelectorAll(`script[src="${MOLSTAR_SCRIPT}"], #pdbe-molstar-style`)
      .forEach((e) => e.remove());
    TestBed.configureTestingModule({});
    loader = TestBed.inject(MolstarLoader);
  });

  function script(): HTMLScriptElement | null {
    return document.querySelector(`script[src="${MOLSTAR_SCRIPT}"]`);
  }

  function stylesheet(): HTMLLinkElement | null {
    return document.getElementById('pdbe-molstar-style') as HTMLLinkElement | null;
  }

  it('adds nothing until a viewer asks for it', () => {
    TestBed.tick();

    expect(script()).toBeNull();
    expect(stylesheet()).toBeNull();
  });

  it('adds the script once and resolves when it loads', async () => {
    const first = loader.load();
    const second = loader.load();
    script()!.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBeUndefined();
    expect(second).toBe(first);
    expect(document.querySelectorAll(`script[src="${MOLSTAR_SCRIPT}"]`).length).toBe(1);
  });

  it('rejects when the script fails to load', async () => {
    const loading = loader.load();
    script()!.dispatchEvent(new Event('error'));

    await expect(loading).rejects.toThrow(MOLSTAR_SCRIPT);
  });

  it('switches the viewer stylesheet with the theme', () => {
    const theme = TestBed.inject(Theme);
    theme.mode.set('light');
    void loader.load();
    TestBed.tick();
    const light = stylesheet()?.getAttribute('href');

    theme.mode.set('dark');
    TestBed.tick();

    expect(light).toBe(MOLSTAR_STYLES.light);
    expect(stylesheet()?.getAttribute('href')).toBe(MOLSTAR_STYLES.dark);
  });
});
