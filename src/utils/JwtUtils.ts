import { HttpHelper } from 'ihub-framework-ts/dist/helpers';
import jwt from 'jsonwebtoken'

interface IJWTPayload{
    hasError: Boolean,
    data?:any,
    error?: string
}

interface IValidation{
    isValid: Boolean,
    data?: any,
    error?: string
}
export class JWTUtils {
    constructor(){}

    public static decode(tokenJWT: string):IJWTPayload {
        if (!tokenJWT) {
            return { hasError: true, error: 'It wasn\'t possible to decode the specified token because it\'s null' }
        }

        const validation = this.isValid(tokenJWT)

        if(!validation.isValid){
            return { hasError: true, error: validation.error }
        }

        const isExpired = this.isExpired(validation.data)

        if(isExpired){
            return { hasError: true, error: 'It wasn\'t possible to decode the specified token because it\'s expired' }
        }

        return { hasError: false, data: validation.data }
    }

    private static isExpired(tokenData: any): Boolean {
        if (Date.now() >= tokenData.exp * 1000) {
            return true;
        }
        return false
    }

    private static isValid(token: string): IValidation {
        const [prefix, value] = token.split(' ')

        if(prefix !== 'Bearer'){
            return { isValid: false, error: 'It wasn\'t possible to decode the specified token because out of format' }
        }

        const decoded = jwt.decode(value);

        if(!decoded){
            return { isValid: false, error: 'It wasn\'t possible to decode the specified token because out of format' }
        }

        // eslint-disable-next-line no-prototype-builtins
        if(!decoded.hasOwnProperty("email") || !decoded.hasOwnProperty("stores")){
            return { isValid: false, error: 'It wasn\'t possible to decode the specified token because out of format' }
        }

        return { isValid: true, data: decoded }
    }
}
