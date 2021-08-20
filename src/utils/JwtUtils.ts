import jwt from 'jsonwebtoken'

interface Ijwt {
    decode: Function
}

const JWT: Ijwt = {
    decode: (token: string) => {
        if (!token) {
            throw new Error('It wasn\'t possible to decode the specified token because it\'s null');
        }

        const [prefix, value] = token.split(' ')

        if(prefix !== 'Bearer'){
            throw new Error('It wasn\'t possible to decode the specified token because out of format');
        }

        const decoded = jwt.decode(value);

        if(!decoded){
            return null
        }

        // eslint-disable-next-line no-prototype-builtins
        if(!decoded.hasOwnProperty("email") || !decoded.hasOwnProperty("stores")){
            throw new Error('It wasn\'t possible to decode the specified token because out of format');
        }

        return decoded
    }
};


export default JWT;
