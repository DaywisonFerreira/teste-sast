import { ObjectId } from 'mongodb';

export function isValidObjectId(id: any) {
    if (ObjectId.isValid(id)) {
        if (String(new ObjectId(id)) === id) return true;
        return false;
    }
    return false;
}
