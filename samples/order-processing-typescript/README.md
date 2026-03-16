# Function receives an order JSON and creates an object in a bucket
The JSON document type the function processes is defined in [func.ts](func.ts#L7-L11) and an example can be found in the guide below. The object is written to a target bucket configured through environment variables.

As an alternative to the OCI Object Storage API this function also shows how to use the OCI Object Storage Amazon S3 Compatibility APIs. In production-usage you'd not use both at the same time, but we make it easy for testing purposes to change the used API through environment variables so you can experience both options.


## Prerequisites
Before you deploy this sample function, make sure you have run step A, B and C of the [Oracle Functions Quick Start Guide for Cloud Shell](https://www.oracle.com/webfolder/technetwork/tutorials/infographics/oci_functions_cloudshell_quickview/functions_quickview_top/functions_quickview/index.html)
* A - Set up your tenancy
* B - Create application
* C - Set up your Cloud Shell dev environment


## List Applications 
Assuming you have successfully completed the prerequisites, you should see your application in the list of applications.
```
fn ls apps
```


## Create or Update your Dynamic Group
In order to use other OCI Services, your function must be part of a dynamic group. For information on how to create a dynamic group, refer to the [documentation](https://docs.cloud.oracle.com/iaas/Content/Identity/Tasks/managingdynamicgroups.htm#To).

When specifying the *Matching Rules*, we suggest matching all functions in a compartment with:
```
ALL {resource.type = 'fnfunc', resource.compartment.id = 'ocid1.compartment.oc1..aaaaaxxxxx'}
```
Please check the [Accessing Other Oracle Cloud Infrastructure Resources from Running Functions](https://docs.cloud.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsaccessingociresources.htm) for other *Matching Rules* options.


## Create or Update IAM Policies
Create a new policy that allows the dynamic group to write to the target bucket.

Your policy should look something like this:
```
Allow dynamic-group <dynamic-group-name> to use buckets in compartment <compartment-name>
Allow dynamic-group <dynamic-group-name> to manage objects in compartment <compartment-name>
```
For more information on how to create policies, check the [documentation](https://docs.cloud.oracle.com/iaas/Content/Identity/Concepts/policysyntax.htm).


## Review and customize your function
Review the following files in the current folder:
* the code of the function, [func.ts](./func.ts)
* its dependencies, [package.json](./package.json)
* its dockerfile, [Dockerfile](./Dockerfile)
* the function metadata, [func.yaml](./func.yaml)


## Set the function environment values
The function requires the following environment values to be set:
- OS_NAMESPACE, the value should be your tenancy's object storage namespace name

Configure the value before deployment in the `func.yaml` file.


## Deploy the function
In Cloud Shell, run the fn deploy command to build the function and its dependencies as a Docker image,
push the image to OCIR, and deploy the function to Oracle Functions in your application.

```
fn -v deploy --app <your app name>
```
e.g.
```
fn -v deploy --app myapp
```


## Invoke the function
Invoke the function as follows:

```
echo -n '<JSON message>' | fn invoke <your app name> order-processing
```
e.g.:
```
echo -n '{"orderId": "43", "price": 43.99, "product": "Coffee Beans"}' | fn invoke order-processing-app order-processing
```


## Monitoring Functions

Learn how to configure basic observability for your function using metrics, alarms and email alerts:
* [Basic Guidance for Monitoring your Functions](../basic-observability/functions.md)


## Writing to OCI Object Storage using the Amazon S3 Compatibility API
To start using the OCI Object Storage Amazon S3 Compatibility API you need to set the following environment variables of the function:
- TARGET_API, change the value from "OCI" to "S3" to switch the used API
- AWS_ACCESS_KEY_ID, set this to the *Access key* of your created *Customer Secret Key*
- AWS_SECRET_ACCESS_KEY, set this to the *Secret key* of your created *Customer Secret Key*

Configure the value before deployment in the `func.yaml` file or after deployment through the OCI Console.
