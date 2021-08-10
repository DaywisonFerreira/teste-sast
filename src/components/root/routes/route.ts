import { RequestPrivate, Response, Route } from 'ihub-framework-ts';

export default [
    {
        method: 'get',
        path: '/health',
        private: false,
        controller: async (req: RequestPrivate, res: Response): Promise<void> => {
            res.json({ message: 'OK' });
        },
    },
] as Route[];
