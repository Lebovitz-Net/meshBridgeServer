export const dispatchChannels = {
    ChannelInfo: (packet) => {
        console.log('.../ChannelInfo', packet);
    },

    ContactsStart: (packet) => {
        console.log('.../ContactsStart', packet);
    },

    EndOfContacts: (packet) => {
        console.log('.../EndOfContacts', packet);
    },
}
