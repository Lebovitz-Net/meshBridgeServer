import { getTextFromKey, hashPublicKey, getPublicKeyValue } from "../packetUtils.js";
import { insertHandlers } from "../../db/insertHandlers.js";

export const dispatchChannels = {
    ChannelInfo: (packet) => {
        const {data, meta} = packet.data;
        const { channelIdx, name, secret } = data;
        
        const shaped = {
            channelIdx,
            channelNum: channelIdx,
            nodeNum: hashPublicKey(secret),
            protocol: 'meshcore', // meshcore
            name,
            role: null,
            psk: getTextFromKey(secret),
            options: JSON.stringify({}),
            ...meta,
        }
        if (name && name !== '' && getPublicKeyValue(secret))
            insertHandlers.insertChannel(shaped);
        else console.log(`.../ChannelInfo idx ${data.channelIdx} name ${data.name} key ${getPublicKeyValue(secret)}`);
    },

    ContactsStart: (packet) => {
        console.log('.../ContactsStart', packet);
    },

    EndOfContacts: (packet) => {
        console.log('.../EndOfContacts', packet);
    },
}

/*
        channelIdx INTEGER PRIMARY KEY,
        channelNum INTEGER,
        num INTEGER,
        protcol INTEGER DEFAULT 0,
        name TEXT,
        role TEXT,
        psk TEXT,
        options TEXT,
        timestamp INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (num) REFERENCES my_info(myNodeNum)
        */