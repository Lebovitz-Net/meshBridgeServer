    export const getHexKey = (name) => {
        try {
            return getHexFromKey(repeaterContacts.get(name).publicKey);
        } catch (err) { return null };
    };

    export const getHexFromKey = (key) => {
        if (key instanceof String) {
            return  Uint8Array.from(Buffer.from(key, "hex"));
        }
    }

    export const getTextFromKey = (key) => {
        if (key instanceof Uint8Array) {
            return Array.from(key)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join('');
        }
    }
    
    export const repeaterContacts = new Map ([
        [
            'cmb3',
            { 
                publicKey: "D11392615ECCB84DA46F224217DEA32AF53AE9762F1F7424A5541CDD4F3367C9",
                type: 1, // type = repeater
                flags: 0, // flags
                outPathLen: 0, // outPathLen
                outPath: new Uint8Array(64), // outPath
                advName: "CMB3-BOSTONME.SH", // advName
                lastAdvert: Math.floor(Date.now() / 1000), // lastAdvert
                advLat: 42358197, // advLat
                advLon: -71107924 // advLon
            },
        ],
        [
            'bos4',
            {
                publicKey: "D87B0250A89E4CAB825F77B171D63262D9C7A387F57205E0ADB39B37D10287BA",
                type: 1, // type = repeater
                flags: 0, // flags
                outPathLen: 0, // outPathLen
                outPath: new Uint8Array(64), // outPath
                advName: "BOS_Longwood4", // advName
                lastAdvert: Math.floor(Date.now() / 1000), // lastAdvert
                advLat: 4233681, // advLat
                advLon: -7110181 // advLon
            },
        ],
                [
            'cmb1',
            {
                publicKey: "DFBFE7AC10D14063848B4E350A715EA583ECB361A6DDABDB375D9EECC959DE04",
                type: 1, // type = repeater
                flags: 0, // flags
                outPathLen: 0, // outPathLen
                outPath: new Uint8Array(64), // outPath
                advName: "CMB1 | BostonMe.sh", // advName
                lastAdvert: Math.floor(Date.now() / 1000), // lastAdvert
                advLat: 42359500, // advLat
                advLon: -71100960 // advLon
            },
        ]
    ]);
