// Pin abhi active hai ya expire ho chuka
export const isPinned = (msg) =>
  Boolean(
    msg?.pinnedUntil &&
      !msg.isDeleted &&
      new Date(msg.pinnedUntil).getTime() > Date.now()
  );
