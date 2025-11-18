export const dispatchConfigs = {
    DeviceInfo: (data) => {
        console.log('.../dispatchConfigs DeviceFinfo');
    },
    Err: (packet) => {
        const { data, meta } = packet.data;
        console.log('.../dispatchConfigs Error Code: ', data.errCode);
    },
    
}