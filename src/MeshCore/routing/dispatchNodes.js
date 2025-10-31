export const dispatchNodes = {
    SelfInfo: (packet) => {
        console.log('.../dispatch nodes selfInfo', packet);
    },
    Ok: (packet) => {
        console.log('.../dispatchNodes Ok');
    }
}