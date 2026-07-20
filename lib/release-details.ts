type ReleaseDetails = {
  version: string;
  channel: string | null;
  updateId: string | null;
};

export const formatReleaseDetails = ({ version, channel, updateId }: ReleaseDetails) => {
  const releaseChannel = channel?.trim() || 'development';
  const updateIdentifier = updateId?.slice(0, 7);

  return [
    `Version ${version}`,
    updateIdentifier ? `• ${updateIdentifier}` : null,
    `(${releaseChannel})`,
  ]
    .filter(Boolean)
    .join(' ');
};
