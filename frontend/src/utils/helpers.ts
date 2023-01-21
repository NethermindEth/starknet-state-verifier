export const shortenHex = (hexString: string, length: number = 4) => {
    return `
        ${hexString.substring(0, length)}...${hexString.substring(hexString.length-length, hexString.length)}
    `;
}