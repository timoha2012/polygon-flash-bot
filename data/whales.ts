type whaleInfo = {
    name: string;
    address: string;
    tokens: string[];
};

type whaleMap = { [key: string]: whaleInfo };

export const whales : whaleMap = {
    "Account1": {
        name: "Aave",
        address: "0x0c54a0BCCF5079478a144dBae1AFcb4FEdf7b263",
        tokens: ["WMATIC"]
    },

};