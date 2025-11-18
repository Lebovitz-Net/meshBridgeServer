import { hashPublicKey, getTextFromKey } from "../packetUtils.js";
import { insertMyInfo } from "../../db/inserts/configInserts.js";

export const dispatchNodes = {
    SelfInfo: (packet) => {
        console.log('.../dispatch nodes selfInfo');
        const { data, meta } = packet.data;
        const { type, name, publicKey, txPower, maxTxPower, advLat, advLon,
                reserved, manualAddContacts, radioFreq, radioBw, radioSf, radioCf } = data;

        const shaped = {
            id: name,
            myNodeNum: hashPublicKey(publicKey),
            type,
            name,
            publicKey: getTextFromKey(publicKey),
            options: JSON.stringify({ txPower, maxTxPower, advLat, advLon, reserved, manualAddContacts,
                      radioFreq, radioBw, radioSf, radioCf }),
            protocol: 'meshcore', // meshcore
            ...meta,
        }
        insertMyInfo(shaped);

    },
    Ok: (packet) => {
        console.log('.../dispatchNodes Ok');
    },
    ContactMsgResponse: (packet) => {
        const { data, meta } = packet;
        const { advName, publicKey, lastAdvert, lastmod, 
                advlat, advlon, outPath, outPathLen, flags} = data.data;
        const shaped = {
            contactId: advName,
            nodeNum: hashPublicKey(publicKey),
            type,
            name: advName,
            shortName: null,
            publicKey,
            times: JSON.stringify({ lastAdvert, lastMod }),
            position: JSON.stringify({advlat, advlon}),
            path: JSON.stringify({outPath, outPathLen}),
            options: JSON.stringify ({ flags }),
            ...meta,
        }
        // insertUser
    }
}