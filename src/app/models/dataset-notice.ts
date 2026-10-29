import { DataIndex, DataVersion, versionName } from './lrrk2';

/**
 * A button in the dataset notice that opens another data package by its date.
 */
export interface NoticeAction {
  label: string;
  target: DataVersion;
}

/**
 * What the dataset notice shows: a headline about the package on screen, its own message if it has
 * one, and optionally a button to another package.
 */
export interface DatasetNotice {
  current: DataVersion;
  headline: string;
  message: string | null;
  action: NoticeAction | null;
}

/**
 * Decides the dataset notice for the package on screen, or null when none is needed.
 *
 * An older package offers the latest one, and says so when it is the published package. A package's
 * own `notice` text is always shown; on the latest package it is the only reason to show the notice.
 */
export function describeNotice(
  index: DataIndex | null | undefined,
  current: DataVersion | undefined,
): DatasetNotice | null {
  if (!index || !current) {
    return null;
  }
  const latest = index.versions.find((v) => v.id === index.latest);
  const message = current.notice ?? null;
  if (latest && current.id !== latest.id) {
    return {
      current,
      headline: current.published
        ? `Viewing the published dataset: ${versionName(current)}`
        : `Viewing data from ${versionName(current)}`,
      message,
      action: { label: `View latest (${versionName(latest)})`, target: latest },
    };
  }
  return message
    ? { current, headline: `Viewing ${versionName(current)}`, message, action: null }
    : null;
}
