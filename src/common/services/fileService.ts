import fs from 'fs'
import xlsx from 'xlsx';

import { logger } from 'ihub-framework-ts';

export class FileService {
    private static directory_path = process.env.NODE_ENV === 'production' ? `${process.cwd()}/dist/tmp` : `${process.cwd()}/src/tmp`;

    constructor(){}

	public static createXlsxLocally(data: unknown[]){

        if (!fs.existsSync(this.directory_path)){
            fs.mkdirSync(this.directory_path);
        }

		const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(data);

		xlsx.utils.book_append_sheet(workbook, worksheet);

        const fileName = `Status_Entregas_${Date.now().toString()}.xlsx`;

        xlsx.writeFile(workbook, `${this.directory_path}/${fileName}`);

        return {
            path: `${this.directory_path}/${fileName}`,
            fileName
        }
	}

	public static deleteFileLocally(path: string){
        try {
            fs.unlinkSync(path);
        } catch (error) {
            logger.error(error.message, 'fileService.delete.error', { stack: error.stack });
        }
	}

    public static existsLocally(path:string){
        return fs.existsSync(path)
    }
}

