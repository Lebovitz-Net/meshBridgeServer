import { hash } from "crypto";
import { getTextFromKey, hashPublicKey } from "../packetUtils.js";
import { insertHandlers } from '../../db/insertHandlers.js';

export const dispatchContacts = {
    Contact: (packet) => {
        const { data, meta } = packet.data;
        const { publicKey, type, flags, outPathLen, outPath, advName,
                lastAdvert, advLat, advLon, lastMod } = data;
        const shaped = {
            contactId: advName,
            type,
            name: advName,
            publicKey: getTextFromKey(publicKey),
            protocol: 'meshcore',
            nodeNum: hashPublicKey(publicKey),
            shortName: null,
            times: JSON.stringify({ lastHeard: lastAdvert, lastMod }),
            options:  JSON.stringify({ outPath, outPathLen, flags}),
            position: JSON.stringify({ lat:advLat, lon:advLon }),
            ...meta,
        }
        console.log ('.../dispatchContacts Contact');

        insertHandlers.insertUsers(shaped);
        
    }
}

/*
    contactId TEXT PRIMARY KEY, -- advName or String nodeNum
    type INTEGER DEFAULT 0,     -- type
    name TEXT,                  -- advName, longname
    publicKey TEXT,             -- publicKey
    timestamp INTEGER,
    protocol INTEGER,

    -- Meshtastic
    nodeNum INTEGER,            -- nodeNum, or publicKey Hash
    shortName TEXT              -- shortName Meshtastic

    times TEXT,                 -- lastHeard, lastMod, updateAt
    options TEXT                -- hwModel, macaddr, ismessageable, outPath, outPathLen, flags
    position TEXT               -- advlat, advlon or latitude, longitude from position
*/