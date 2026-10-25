# LRRK2 Variant Activity Browser

Static Angular site with interactive Plotly views of LRRK2 variant activity data.

## Data

The workbook is converted into dated data packages under `public/data/<YYYY-MM-DD>/`, listed newest first in `public/data/index.json`:

```bash
poetry install
poetry run python scripts/convert_xlsx.py --date 2026-10-23 --label "Initial release"
```

Each package contains:

- `variants.json`: the Figure 2A screen (360 variants, pRAB10/RAB10 mean, SD, domain, MDSG classification, outcome) and domain boundaries.
- `replicates.json`: the Figure 4 replicate measurements for controls and activating variants, with mean and SD.

To publish an update, run the script with a new `--date` (default: today) and optionally `--workbook path/to/new.xlsx`. Older packages stay available; re-using a date replaces that package.

Every view URL carries the package date, e.g. `#/2026-10-23/activity-ranking`. `#/latest/...` always follows the newest package, and unknown dates redirect to `latest`.

## Structure view

The Activating variants view includes a 3D structure explorer that renders the AlphaFold DB model [AF-Q5S007-F1](https://alphafold.ebi.ac.uk/entry/Q5S007) v6 (CC-BY 4.0), bundled as `public/structures/AF-Q5S007-F1-model_v6.bcif`, with the [PDBe Mol*](https://github.com/PDBeurope/pdbe-molstar) web component. The Mol* script and stylesheets are emitted as separate, non-injected bundles (`angular.json`) and only downloaded when that view is opened. The AlphaFold model is used because the experimental cryo-EM structures leave most of the ARM domain unresolved.

## Publishing

`.github/workflows/deploy-pages.yml` tests, builds and deploys the site to GitHub Pages on every push to `main` or `master` (or manually from the Actions tab). In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The site uses hash-based URLs and a relative base path, so it works from the `https://<user>.github.io/<repo>/` subpath without extra configuration.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
