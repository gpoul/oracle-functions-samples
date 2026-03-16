import { handle } from '@fnproject/fdk'; // Import is needed as the new handler object, changes made to the "edge" and not impacting business logic.
import { ResourcePrincipalAuthenticationDetailsProvider } from 'oci-common';
import { ObjectStorageClient, requests } from 'oci-objectstorage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; //Import native TypeScript SDK for S3

// Define the shape of the input event
type PurchaseEvent = {
    orderId: string;
    price: number;
    product: string;
}

// Access environment variables
const objectStorageNamespace = process.env.OS_NAMESPACE;
if (!objectStorageNamespace) {
  throw new Error('OS_NAMESPACE environment variable is not set');
}
const regionEnv = process.env.OCI_REGION_METADATA;
if (!regionEnv) {
  throw new Error('OCI_REGION_METADATA environment variable is not set');
}
const targetAPI = process.env.TARGET_API;
if (!targetAPI) {
    throw new Error('TARGET_API environment variable is not set')
}
if (targetAPI != "S3" && targetAPI != "OCI") {
    throw new Error('TARGET_API has to bei either "S3" or "OCI"');
}

// Access environment variables for S3 API compatibility
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
if (!accessKeyId) {
  throw new Error('AWS_ACCESS_KEY_ID environment variable is not set');
}
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (!secretAccessKey) {
  throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set');
}

// Define the shape of region metadata
type RegionMetadata = {
    realmDomainComponent: string, 
    realmKey: string,
    regionIdentifier: string, // Sample: "eu-frankfurt-1"
    regionKey: string
}

// Retrieve region from OCI_REGION_METADATA
const parsedRegionMetadata: RegionMetadata = JSON.parse(regionEnv);
const region = parsedRegionMetadata.regionIdentifier;

// Initialize the S3 client outside the handler for reuse
const endpointURL = "https://" + objectStorageNamespace + ".compat.objectstorage." + region + ".oraclecloud.com"
const s3Client = new S3Client({endpoint: endpointURL,
    credentials: {accessKeyId: accessKeyId, secretAccessKey: secretAccessKey},
    region: region, forcePathStyle: true });

// Make ObjectStorageClient available for reuse
var osClient : ObjectStorageClient;

/**
 * Lambda handler for processing orders and storing them in Object storage
 */
export const handler = async (event: PurchaseEvent): Promise<string> => {
    try {
        // Access environment variables
        const bucketName = process.env.TARGET_BUCKET;
        if (!bucketName) {
            throw new Error('TARGET_BUCKET environment variable is not set');
        }

        // Initialize ObjectStorageClient if not yet available; ResourcePrincipal auth is not available before first invoke
        if (!osClient) {
            const authenticationProvider = await ResourcePrincipalAuthenticationDetailsProvider.builder();
            osClient = new ObjectStorageClient({ authenticationDetailsProvider: authenticationProvider });
        }

        // Create the order content and key destination
        const orderContent = `OrderID: ${event.orderId}\nPrice: $${event.price.toFixed(2)}\nProduct: ${event.product}`;
        const key = `order/${event.orderId}.txt`;

        if (targetAPI == 'S3') {
            // Upload the order to S3
            await uploadOrderToS3(bucketName, key, orderContent);
        } else if (targetAPI == 'OCI') {
            // Upload the order to OCI Object Storage
            await uploadOrderToOS(objectStorageNamespace, bucketName, key, orderContent);
        } else {
            throw new Error('Target API was not S3 or OCI, so nothing was called.');
        }

        console.log(`Successfully processed order ${event.orderId} and stored in Object bucket ${bucketName}`);
        return 'Success';
    } catch (error) {
        console.error(`Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};

/**
 * OCI Functions handler for processing orders and storing them in Object Storage.
 */

handle(handler, { inputMode: 'json' })

/**
 * Helper function to upload order to Object Storage using Amazon S3 SDK
 */
async function uploadOrderToS3(bucketName: string, key: string, orderContent: string): Promise<void> {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: orderContent
        });

        await s3Client.send(command);
    } catch (error) {
        throw new Error(`Failed to upload order to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Helper function to upload order to Object Storage using OCI SDK
 */
async function uploadOrderToOS(namespace: string, bucketName: string, key: string, orderContent: string): Promise<void> {
    try {
        const putObjectRequest: requests.PutObjectRequest = {
            namespaceName: namespace,
            bucketName: bucketName,
            putObjectBody: orderContent,
            objectName: key
        };
        const putObjectResponse = await osClient.putObject(putObjectRequest);
        console.log("Put Object executed successfully" + putObjectResponse);
    } catch (error) {
        throw new Error(`Failed to upload order to OCI Object Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
