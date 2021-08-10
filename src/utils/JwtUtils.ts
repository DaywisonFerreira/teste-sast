import jwt from 'jsonwebtoken'

const JWT: any = {
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
            return {}
        }

        return decoded
    }
};


export default JWT;
