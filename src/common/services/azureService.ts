
import fs from 'fs'
import { LogService } from '@infralabs/infra-logger';
import { createBlobService,  } from 'azure-storage';

interface File {
    path: string,
    fileName: string
}

export class AzureService {
    constructor(){}

	public static async uploadFile(file: File, logger: LogService): Promise<String>{
        return new Promise((resolve, reject) => {
            const blobSvc = createBlobService(String(process.env.ACCESS_KEY));
            blobSvc.createBlockBlobFromLocalFile(String(process.env.CONTAINER_NAME), file.fileName, file.path, (error) => {
                if (error) {
                    reject(error)
                }
                logger.add('ifc.freight.api.orders.azureService.uploadFile', `Create file on Azure ${file.fileName} - ${new Date().toISOString()}`);
                resolve(`${String(process.env.STORAGE_URL)}/${String(process.env.CONTAINER_NAME)}/${file.fileName}`)
            })
        });
	}
}

