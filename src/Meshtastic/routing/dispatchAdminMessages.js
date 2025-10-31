import { insertHandlers } from '../db/insertHandlers.js';
import { emitOverlay } from '../overlays/overlayEmitter.js';
import { emitEvent } from '../events/eventEmitter.js';
import { decodePythonString } from '../utils/stringUtils.js';


export const dispatchAdminMessages = {
    getOwnerResponse: (packet) => {
        console.log ('.../adminMessage getOwnerReponse', packet);
    },
};
