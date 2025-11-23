// utiilities for the server
export const normalizeIn = (time) => (time < 2000000000) ? time * 1000 : time;
export const normalizeOut = (time) => (time < 2000000000) ? time : time / 1000;
