export const JB_Paper1 = [
  {
    id: "s13q1",
    domain: `Domain - Development with AWS Services`,
    text: `A company offers a Generative Artificial Intelligence (AI) service exposed through a REST API managed by Amazon API Gateway. They recently rolled out a subscription tier where users receive API keys to access premium features. The company uses the CreateApiKey API for generating these keys.

During testing, developers noticed that while existing users can access the service without issues, new premium subscribers get a 403 Forbidden error when using their API keys.

What must be done to give new users access to the service?`,
    answers: [
      "Use the ImportApiKeys operation to import the premium users' keys, then apply the UpdateUsagePlan operation to set the new tier access.",
      "Use the UpdateAuthorizer operation to modify the authorization settings. Promote the changes to the production stage by calling the CreateDeployment operation.",
      "Associate the API keys for the premium users with the intended usage plan using the CreateUsagePlanKey operation.",
      "Instruct users to send their API key in a custom header. In the integration request, adjust the mapping template to extract and evaluate this header to distinguish between free-tier and premium subscribers.",
    ],
    correctAnswerIndex: 2,
    correctAnswerIndices: [2],
    isMultiSelect: false,
    explanation: `
Overall explanation

In Amazon API Gateway, API keys by themselves do not grant access to execute an API. They need to be associated with a usage plan, and that usage plan then determines which API stages and methods the API key can access.

<image src='JB_Paper1_Q1.png' alt="Image" style="max-width:100%; height:auto;"/>

If the API key is not associated with a usage plan, it will not have permission to access any of the resources, which will result in a "403 Forbidden" error.

In the given scenario, existing users can access the service, but new premium subscribers cannot. This indicates that while the API keys were created for new users, they might not have been associated with the appropriate usage plan. Hence, after generating an API key, it must be added to a usage plan by calling the CreateUsagePlanKey method.

Hence, the correct answer is: Associate the API keys for the premium users with the intended usage plan using the CreateUsagePlanKey operation.

The option that says: Use the ImportApiKeys operation to import the premium users' keys, then apply the UpdateUsagePlan operation to set the new tier access is incorrect. The importApiKeys API is primarily used for bulk importing API keys, not for associating them with a usage plan. Although the updateUsagePlan API modifies properties of a usage plan; it doesn't handle direct association of API keys.

The option that says: Use the UpdateAuthorizer operation to modify the authorization settings. Promote the changes to the production stage by calling the CreateDeployment operation is incorrect. The updateAuthorizer operation is only used to modify the settings of an existing custom authorizer, which handles custom authorization logic for APIs. In the scenario, the issue is not related to custom authorization but rather to the association of API keys with a usage plan.

The option that says: Instruct users to send their API key in a custom header. In the integration request, adjust the mapping template to extract and evaluate this header to distinguish between free-tier and premium subscribers is incorrect. Changing the way users provide their API key adds unnecessary complexity and won't solve the issue at hand. The problem isn't with how the API key is being sent but with the API key not having appropriate permissions because it's not associated with a usage plan.

References:

https://docs.aws.amazon.com/apigateway/latest/api/API_UpdateUsagePlan.html

https://docs.aws.amazon.com/apigateway/latest/api/API_CreateApiKey.html



Check out this Amazon API Gateway Cheat Sheet:

https://tutorialsdojo.com/amazon-api-gateway/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q2",
    domain: "Domain - Development with AWS Services",
    text: `A company has a microservices application that must be integrated with API Gateway. The developer must configure custom data mapping between the API Gateway and the microservices.

In addition, the developer must specify how the incoming request data is mapped to the integration request and how the resulting integration response data is mapped to the method response.

Which of the following integration types is the MOST suitable one to use in API Gateway to meet this requirement?`,
    answers: ["AWS", "HTTP_PROXY", "HTTP", "AWS_PROXY"],
    correctAnswerIndex: 2,
    correctAnswerIndices: [2],
    isMultiSelect: false,
    explanation: `
Overall explanation
You can integrate an API method in your API Gateway with a custom HTTP endpoint of your application in two ways:

- HTTP proxy integration

- HTTP custom integration

In your API Gateway console, you can define the type of HTTP integration of your resource by toggling the "Proxy resource" switch.

<image src='JB_Paper1_Q2.png' alt="Image" style="max-width:100%; height:auto;"/>

With proxy integration, the setup is simple. You only need to set the HTTP method and the HTTP endpoint URI, according to the backend requirements, if you are not concerned with content encoding or caching.

With custom integration, setup is more involved. In addition to the proxy integration setup steps, you need to specify how the incoming request data is mapped to the integration request and how the resulting integration response data is mapped to the method response. API Gateway supports the following endpoint ports: 80, 443 and 1024-65535.

Programmatically, you choose an integration type by setting the type property on the Integration resource. For the Lambda proxy integration, the value is AWS_PROXY. For the Lambda custom integration and all other AWS integrations, it is AWS. For the HTTP proxy integration and HTTP integration, the value is HTTP_PROXY and HTTP, respectively. For the mock integration, the type value is MOCK.

Since the integration type that is being described in the scenario fits the definition of an HTTP custom integration, the correct answer in this scenario is to use the HTTP integration type.



Hence, the correct answer is: HTTP.

AWS is incorrect because this type is primarily used for Lambda custom integration. Since the scenario does not specify that the microservices are Lambda functions, the HTTP integration type is the most flexible and suitable for such a scenario.



AWS_PROXY is incorrect because this type is primarily used for Lambda proxy integration. The scenario didn't mention that it uses a serverless application or Lambda.

HTTP_PROXY is incorrect because this type is only used for HTTP proxy integration where you don't need to do data mapping for your request and response data.

References:

https://docs.aws.amazon.com/apigateway/latest/developerguide/setup-http-integrations.html

https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-integration-types.html



Check out this Amazon API Gateway Cheat Sheet:

https://tutorialsdojo.com/amazon-api-gateway/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q3",
    domain: "Domain - Development with AWS Services",
    text: `A developer is managing a serverless application orchestrated by AWS Step Functions. One of the Lambda functions sends an API call to a third-party payment service, which takes some time to complete. The Step Functions workflow needs to pause while the service validates the payment. It should only resume after the service sends a notification to a webhook endpoint.

Which combination of actions will fulfill the requirements in the most cost-effective manner? (Select Two)`,
    answers: [
      "Set the invocation method of the Lambda function task state to asynchronous. Create an AWS SQS queue and configure the webhook handler to send the payment service’s response to the queue. Use a combination of Wait State and Choice State to poll the queue.",
      "Use a Wait State to pause the execution of the workflow. Configure the webhook handler to invoke the Lambda function synchronously.",
      "Configure the Lambda function task state to use the waitForTaskToken option. Retrieve the task token from the context object of the state machine and include it as part of the Lambda function’s payload body.",
      "Configure the webhook handler to call the SendTaskHeartbeat method after a successful notification.",
      "Configure the webhook handler to call the SendTaskSuccess method after a successful notification.",
    ],
    correctAnswerIndex: null,
    correctAnswerIndices: [2, 4],
    isMultiSelect: true,
    explanation: `
Overall explanation
In AWS Step Functions, the waitForTaskToken option allows a task to be paused until an external system signals its completion. When a task is configured with this option, Step Functions generates a unique token, which can be retrieved from the context object of the state machine. This token, for instance, can be stored in a data store for reference.

The diagram below depicts how waitForTaskToken is used for an SQS task state.

<image src='JB_Paper1_Q3.png' alt="Image" style="max-width:100%; height:auto;"/>

An external system, such as a webhook handler can then reference the token and call the SendTaskSuccess or SendTaskFailure method to signal Step Functions to resume the workflow. When the workflow is in a paused state, you're not billed for the time the workflow is paused, making it a cost-effective method for awaiting external processes or events.

Hence, the correct answers are:

Configure the Lambda function task state to use the waitForTaskToken option. Retrieve the task token from the context object of the state machine and include it as part of the Lambda function’s payload body.

Configure the webhook handler to call the SendTaskSuccess method after a successful notification.

The option that says: Set the invocation method of the Lambda function task state to asynchronous. Create an AWS SQS queue and configure the webhook handler to send the payment service’s response to the queue. Use a combination of Wait State and Choice State to poll the queue is incorrect. While this solution may work, every iteration involving the Wait State and Choice State incurs a cost as a state transition. If the third-party service takes an unpredictable amount of time, the state machine could go through multiple cycles of waiting and checking the SQS queue, resulting in a higher cost.

The option that says: Use a Wait State to pause the execution of the workflow. Configure the webhook handler to invoke the Lambda function synchronously is incorrect. A fixed Wait State is less cost-effective in scenarios where the waiting duration is unpredictable. If the third-party service finishes earlier than the wait duration, you're paying for unused time. If it takes longer, the workflow might proceed before the task is complete.

The option that says: Configure the webhook handler to call the SendTaskHeartbeat method after a successful notification is incorrect because this method is simply used for keeping tasks alive and preventing them from timing out. It also does not signal completion.



References:

https://aws.amazon.com/blogs/compute/building-cost-effective-aws-step-functions-workflows/

https://docs.aws.amazon.com/step-functions/latest/dg/callback-task-sample-sqs.html

https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html



Check out this AWS Step Functions Cheat Sheet:

https://tutorialsdojo.com/aws-step-functions/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q4",
    domain: "Domain - Security",
    text: `To improve their information security management system (ISMS), a company recently released a new policy which requires all database credentials to be encrypted and be automatically rotated to avoid unauthorized access. 

Which of the following is the MOST appropriate solution to secure the credentials?`,
    answers: [
      "Create a secret in AWS Secrets Manager and enable automatic rotation of the database credentials.",
      "Create a parameter to the Systems Manager Parameter Store using the PutParameter API with a type of SecureString.",
      "Enable IAM DB authentication which rotates the credentials by default.",
      "Create an IAM Role which has full access to the database. Attach the role to the services which require access.",
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
    isMultiSelect: false,
    explanation: `
Overall explanation
AWS Secrets Manager is an AWS service that makes it easier for you to manage secrets. Secrets can be database credentials, passwords, third-party API keys, and even arbitrary text. You can store and control access to these secrets centrally by using the Secrets Manager console, the Secrets Manager command line interface (CLI), or the Secrets Manager API and SDKs.

In the past, when you created a custom application that retrieves information from a database, you typically had to embed the credentials (the secret) for accessing the database directly in the application. When it came time to rotate the credentials, you had to do much more than just create new credentials. You had to invest time to update the application to use the new credentials. Then you had to distribute the updated application. If you had multiple applications that shared credentials and you missed updating one of them, the application would break. Because of this risk, many customers have chosen not to regularly rotate their credentials, which effectively substitutes one risk for another.

<image src='JB_Paper1_Q4.png' alt="Image" style="max-width:100%; height:auto;"/>

Secrets Manager enables you to replace hardcoded credentials in your code (including passwords), with an API call to Secrets Manager to retrieve the secret programmatically. This helps ensure that the secret can't be compromised by someone examining your code, because the secret simply isn't there. Also, you can configure Secrets Manager to automatically rotate the secret for you according to a schedule that you specify. This enables you to replace long-term secrets with short-term ones, which helps to significantly reduce the risk of compromise.

Hence, creating a secret in AWS Secrets Manager and enabling automatic rotation of the database credentials is the most appropriate solution for this scenario.

The option that says: Create a parameter to the Systems Manager Parameter Store using the PutParameter API with a type of SecureString is incorrect because, by default, Systems Manager Parameter Store doesn't rotate its parameters.

The option that says: Enable IAM DB authentication which rotates the credentials by default is incorrect because this solution only enables the service to connect to Amazon RDS with IAM credentials. It doesn't have the capability to rotate the credentials like what AWS Secrets Manager does to its secrets.

The option that says: Create an IAM Role which has full access to the database. Attach the role to the services which requires access is incorrect because although IAM Role is a preferred way to grant access to certain services, this solution doesn't rotate the keys/credentials.



References:

https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-paramstore.html

https://aws.amazon.com/blogs/compute/sharing-secrets-with-aws-lambda-using-aws-systems-manager-parameter-store/



Check out this AWS Secrets Manager Cheat Sheet:

https://tutorialsdojo.com/aws-secrets-manager/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q5",
    domain: "Domain - Troubleshooting and Optimization",
    text: `An API gateway with a Lambda proxy integration takes a long time to complete its processing. There were also occurrences where some requests timed out. You want to monitor the responsiveness of your API calls as well as the underlying Lambda function.

Which of the following CloudWatch metrics should you use to troubleshoot this issue? (Select TWO.)`,
    answers: [
      "IntegrationLatency",
      "Count",
      "CacheMissCount",
      "Latency",
      "CacheHitCount",
    ],
    correctAnswerIndex: null,
    correctAnswerIndices: [0, 3],
    isMultiSelect: true,
    explanation: `
Overall explanation
You can monitor API execution using CloudWatch, which collects and processes raw data from API Gateway into readable, near-real-time metrics. These statistics are recorded for a period of two weeks so that you can access historical information and gain a better perspective on how your web application or service is performing. By default, API Gateway metric data is automatically sent to CloudWatch in one-minute periods.

The metrics reported by API Gateway provide information that you can analyze in different ways. The list below shows some common uses for the metrics. These are suggestions to get you started, not a comprehensive list.

- Monitor the IntegrationLatency metrics to measure the responsiveness of the backend.

- Monitor the Latency metrics to measure the overall responsiveness of your API calls.

- Monitor the CacheHitCount and CacheMissCount metrics to optimize cache capacities to achieve a desired performance.

Hence, the correct metrics that you have to use in this scenario are Latency and IntegrationLatency.

Count is incorrect because this metric simply gets the total number of API requests in a given period.

CacheMissCount is incorrect because this metric just gets the number of requests served from the backend in a given period when API caching is enabled. The Sum statistic represents this metric, namely, the total count of the cache misses in the given period.

CacheHitCount is incorrect because this fetches the number of requests served from the API cache in a given period. The Sum statistic represents this metric, namely, the total count of the cache hits in the given period.



References:

https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-metrics-and-dimensions.html

https://docs.aws.amazon.com/apigateway/latest/developerguide/monitoring-cloudwatch.html



Check out this Amazon API Gateway Cheat Sheet:

https://tutorialsdojo.com/amazon-api-gateway

      `,
    answerExplanations: [],
  },
  {
    id: "s13q6",
    domain: "Domain - Security",
    text: `The users of a social media website must be authenticated using social identity providers such as Twitter, Facebook, and Google. Users can login to the site which will allow them to upload their selfies, memes, and other media files in an S3 bucket. As an additional feature, you should also enable guest user access to certain sections of the website.

Which of the following should you do to accomplish this task?`,
    answers: [
      "Create a custom identity broker which integrates with the AWS Security Token Service and supports unauthenticated access.",
      "Create a User Pool in Amazon Cognito and enable access to unauthenticated identities.",
      "Create an Identity Pool in Amazon Cognito and enable access to unauthenticated identities.",
      "Create an Identity Pool in Amazon Cognito and enable access to unauthenticated identities.",
    ],
    correctAnswerIndex: 2,
    correctAnswerIndices: [2],
    isMultiSelect: false,
    explanation: `
Overall explanation
Amazon Cognito provides authentication, authorization, and user management for your web and mobile apps. Your users can sign in directly with a username and password or through a third party such as Facebook, Amazon, or Google.

The two main components of Amazon Cognito are user pools and identity pools. User pools are user directories that provide sign-up and sign-in options for your app users. Identity pools enable you to grant your users access to other AWS services. You can use identity pools and user pools separately or together.

<image src='JB_Paper1_Q6.png' alt="Image" style="max-width:100%; height:auto;"/>

Amazon Cognito identity pools (federated identities) support user authentication through Amazon Cognito user pools, federated identity providers—including Amazon, Facebook, Google, and SAML identity providers—as well as unauthenticated identities. This feature also supports Developer Authenticated Identities (Identity Pools), which lets you register and authenticate users via your own back-end authentication process.

Hence, the correct answer is: Create an Identity Pool in Amazon Cognito and enabling access to unauthenticated identities

The option that says: Create a User Pool in Amazon Cognito and enable unauthenticated identities is incorrect because you should have created an Identity Pool instead. Take note that a User Pool doesn't have the option to enable unauthenticated identities. Moreover, you won't be able to provide your users access to upload their media files to S3 using a User Pool.

The option that says: Create a custom identity broker which integrates with the AWS Security Token Service and supports unauthenticated access is incorrect because this is not a suitable solution in this scenario. You only need to build a custom identity broker application if your identity store is not compatible with SAML 2.0, which is required for identity federation.

The option that says: Integrate AWS IAM Identity Center is incorrect because this is only used to help you manage access and permissions to custom applications that support Security Assertion Markup Language (SAML) 2.0 and commonly used third-party software as a service (SaaS) applications. This is primarily used for existing corporate identities and not for social identity providers.



References:

https://aws.amazon.com/premiumsupport/knowledge-center/cognito-user-pools-identity-pools/

https://docs.aws.amazon.com/cognito/latest/developerguide/getting-started-with-identity-pools.html



Check out this Amazon Cognito Cheat Sheet:

https://tutorialsdojo.com/amazon-cognito/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q7",
    domain: "Domain - Development with AWS Services",
    text: `A developer is creating a script using AWS CLI to retrieve a list of objects in an S3 bucket. However, the script is timing out if the bucket has tens of thousands of objects.

Which solution would most likely rectify the issue?`,
    answers: [
      "Apply the pagination parameters in the AWS CLI command",
      "Increase the AWS CLI timeout value",
      "Enable Amazon S3 Transfer Acceleration",
      "Enable CORS",
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
    isMultiSelect: false,
    explanation: `
Overall explanation
For commands that possibly return a long list of items, the AWS CLI provides parameters allowing you to limit the number of items included in the output when the AWS CLI queries a service's API.

By default, the AWS CLI retrieves all accessible items with a page size of 1,000. If you need help running list commands on a large number of resources, the default page size of 1000 may be too large. This can cause calls to AWS services to exceed the maximum allowed time, resulting in a "timed out" error.

<image src='JB_Paper1_Q7.png' alt="Image" style="max-width:100%; height:auto;"/>

One of the pagination options you can use is the --page-size option. This option tells the AWS CLI to request a smaller number of items from each call to the AWS service.

aws s3api list-objects --bucket tdbucket --page-size 100

The CLI still retrieves the entire list, but it makes a greater number of service API calls in the background and retrieves fewer items with each request. This increases the probability that individual calls will succeed in without the use of a timeout.

Hence, the correct answer is: Apply the pagination parameters in the AWS CLI command.

The option that says: Increase the AWS CLI timeout value is incorrect. Increasing CLI parameters like --cli-connect-timeout or --cli-read-timeout would only prolong the process and increase susceptibility to timeouts due to network latency. On the other hand, pagination would handle large data sets by retrieving objects in manageable chunks, aligning with S3's response limits and preventing timeouts.

The option that says: Enabling Amazon S3 Transfer Acceleration is incorrect because this is only a bucket-level feature that enables faster data transfers to and from Amazon S3. Although this will improve the retrieval times of your objects, this feature will still not paginate the result, which may still cause time-out errors.

The option that says: Enabling CORS is incorrect because the Cross-origin resource sharing (CORS) is simply thats allow client web applications that are loaded in one domain to communicate with resources in a different domain. This is not useful in paginating the results from an AWS CLI call.



References:

https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-pagination.html

https://docs.aws.amazon.com/cli/latest/reference/s3api/list-objects.html



Check out this AWS CloudShell Cheat Sheet:

https://tutorialsdojo.com/aws-cloudshell/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q8",
    domain: "Domain - Development with AWS Services",
    text: `A developer has recently completed a new version of a serverless application that is ready to be deployed using AWS SAM. There is a requirement that the traffic should shift from the previous Lambda function to the new version in the shortest time possible, but you still don't want to shift traffic all-at-once immediately.

Which deployment configuration is the MOST suitable one to use in this scenario?`,
    answers: [
      "CodeDeployDefault.LambdaLinear10PercentEvery2Minutes",
      "CodeDeployDefault.HalfAtATime",
      "CodeDeployDefault.LambdaCanary10Percent5Minutes",
      "CodeDeployDefault.LambdaLinear10PercentEvery1Minute",
    ],
    correctAnswerIndex: 2,
    correctAnswerIndices: [2],
    isMultiSelect: false,
    explanation: `
Overall explanation
If you use AWS SAM to create your serverless application, it comes built-in with CodeDeploy to help ensure safe Lambda deployments. There are various deployment preference types that you can choose from.

For example:

If you choose Canary10Percent10Minutes then 10 percent of your customer traffic is immediately shifted to your new version. After 10 minutes, all traffic is shifted to the new version.

However, if your pre-hook/post-hook tests fail, or if a CloudWatch alarm is triggered, CodeDeploy rolls back your deployment. The following table outlines other traffic-shifting options that are available:

- Canary: Traffic is shifted in two increments. You can choose from predefined canary options. The options specify the percentage of traffic that's shifted to your updated Lambda function version in the first increment, and the interval, in minutes, before the remaining traffic is shifted in the second increment.

- Linear: Traffic is shifted in equal increments with an equal number of minutes between each increment. You can choose from predefined linear options that specify the percentage of traffic that's shifted in each increment and the number of minutes between each increment.

- All-at-once: All traffic is shifted from the original Lambda function to the updated Lambda function version at once.

<image src='JB_Paper1_Q8.png' alt="Image" style="max-width:100%; height:auto;"/>

Hence, the CodeDeployDefault.LambdaCanary10Percent5Minutes option is correct because 10 percent of your customer traffic is immediately shifted to your new version. After 5 minutes, all traffic is shifted to the new version. This means that the entire deployment time will only take 5 minutes

 

CodeDeployDefault.HalfAtATime is incorrect because this is only applicable for EC2/On-premises compute platform and not for Lambda.

CodeDeployDefault.LambdaLinear10PercentEvery1Minute is incorrect because it will add 10 percent of the traffic linearly to the new version every minute. Hence, all traffic will be shifted to the new version only after 10 minutes

CodeDeployDefault.LambdaLinear10PercentEvery2Minutes is incorrect because it will add 10 percent of the traffic linearly to the new version every 2 minutes. Hence, all traffic will be shifted to the new version only after 20 minutes.

 

References:

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/automating-updates-to-serverless-apps.html

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html
      `,
    answerExplanations: [],
  },
  {
    id: "s13q9",
    domain: "Domain - Development with AWS Services",
    text: `You are developing a Lambda function which processes event notifications from Amazon S3. It is expected that the function will have:

- 50 requests per second

- 100 seconds to complete each request

What should you do to prevent any issues when the function has been deployed and becomes operational?`,
    answers: [
      "Request for AWS to increase the limit of your concurrent executions.",
      "Implement exponential backoff in your application.",
      "No additional action needed since Lambda will automatically scale based on the incoming requests.",
      "Increase the concurrency limit of the function.",
    ],
    correctAnswerIndex: 0,
    correctAnswerIndices: [0],
    isMultiSelect: false,
    explanation: `
Overall explanation
Concurrent executions refers to the number of executions of your function code that are happening at any given time. You can estimate the concurrent execution count, but the concurrent execution count will differ depending on whether or not your Lambda function is processing events from a poll-based event source.

<image src='JB_Paper1_Q9.png' alt="Image" style="max-width:100%; height:auto;"/>

If you create a Lambda function to process events from event sources that aren't poll-based (for example, Lambda can process every event from other sources, like Amazon S3 or API Gateway), each published event is a unit of work, in parallel, up to your account limits. Therefore, the number of invocations these event sources make influences the concurrency.

You can use this formula to estimate the capacity used by your function:

concurrent executions = (invocations per second) x (average execution duration in seconds)

For example, consider a Lambda function that processes Amazon S3 events. Suppose that the Lambda function takes on average three seconds and Amazon S3 publishes 10 events per second. Then, you will have 30 concurrent executions of your Lambda function. See the calculation shown below to visualize the process:

= (10 events per second) x (3 seconds average execution duration)
= 30 concurrent executions

In this scenario, it is expected that the Lambda function takes an average of 100 seconds for every execution with 50 requests per second. Using the formula above, the function will have 5,000 concurrent executions.

= (50 events per second) x (100 seconds average execution duration)
= 5,000 concurrent executions

AWS Lambda dynamically scales function execution in response to increased traffic, up to your concurrency limit. Under sustained load, your function's concurrency bursts to an initial level between 500 and 3000 concurrent executions that varies per region. After the initial burst, the function's capacity increases by an additional 500 concurrent executions each minute until either the load is accommodated, or the total concurrency of all functions in the region hits the limit.

By default, AWS Lambda limits the total concurrent executions across all functions within a given region to 1000. This limit can be raised by requesting for AWS to increase the limit of the concurrent executions of your account.

Since the expected concurrent executions of the Lambda function will exceed the default concurrency limit, the best thing to do here is to request for AWS to increase the limit of your concurrent executions.

Choosing to do no additional action since Lambda will automatically scale based on the incoming requests is incorrect because the dynamic scaling of AWS Lambda has its limits. Because the value of the expected concurrency executions has exceeded the default limit, it is best to contact AWS to increase the concurrent executions of your account to prevent any throttling issues when the function has been deployed and becomes operational.

Implementing an exponential backoff in your application is incorrect because this doesn't address the concurrency issue of your Lambda function. This will just configure your application to have progressively longer waits between API call retries for consecutive error responses.

Increasing the concurrency limit of the function is incorrect because, by default, you can only set the limit as high as 900 per function, which is quite insufficient to handle the expected 5,000 concurrency executions. To properly provide the required capacity needed by the function, you have to request for AWS to increase the concurrency limit of your account.



References:

https://docs.aws.amazon.com/lambda/latest/dg/running-lambda-code.html

https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html#function-configuration



Check out this AWS Lambda Cheat Sheet:

https://tutorialsdojo.com/aws-lambda/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q10",
    domain: "Domain - Troubleshooting and Optimization",
    text: `A company selling smart security cameras uses an S3 bucket behind a CloudFront web distribution to store its static content, which it shares with customers worldwide. The company has recently released a new firmware update intended only for its premium customers, and unauthorized access should be denied with a user authentication process that has minimal latency.

How can a developer refactor the current setup to achieve this requirement with the MOST efficient solution?`,
    answers: [
      "Restrict access to the S3 bucket only to premium customers using an Origin Access Control (OAC).",
      "Use the AWS Serverless Application Model (AWS SAM) and Amazon Cognito to authenticate the premium customers",
      "Use Lambda@Edge and Amazon Cognito to authenticate and authorize premium customers to download the firmware update.",
      "Use Signed URLs and Signed Cookies in CloudFront to distribute the firmware update file.",
    ],
    correctAnswerIndex: 2,
    correctAnswerIndices: [2],
    isMultiSelect: false,
    explanation: `
Overall explanation
Lambda@Edge is a feature of Amazon CloudFront that lets you run code closer to users of your application, which improves performance and reduces latency. With Lambda@Edge, you don't have to provision or manage infrastructure in multiple locations around the world. You pay only for the compute time you consume - there is no charge when your code is not running.

With Lambda@Edge, you can enrich your web applications by making them globally distributed and improving their performance — all with zero server administration. Lambda@Edge runs your code in response to events generated by the Amazon CloudFront content delivery network (CDN). Just upload your code to AWS Lambda, which takes care of everything required to run and scale your code with high availability at an AWS location closest to your end user.

<image src='JB_Paper1_Q10.png' alt="Image" style="max-width:100%; height:auto;"/>

You can use Lambda@Edge to help authenticate and authorize users for the premium pay-wall content on your website, filtering out unauthorized requests before they reach your origin infrastructure. For example, you can trigger a Lambda function to authorize each viewer request by calling authentication and user management service such as Amazon Cognito.

Hence, the correct answer is: Use Lambda@Edge and Amazon Cognito to authenticate and authorize premium customers to download the firmware update.

The option that says: Use the AWS Serverless Application Model (AWS SAM) and Amazon Cognito to authenticate the premium customers is incorrect because AWS SAM is just an open-source framework that you can use to build serverless applications on AWS. In this scenario, you have to integrate your CloudFront web distribution with Lambda@Edge, and you can do this without using AWS SAM.

The option that says: Restrict access to the S3 bucket only to premium customers by using an Origin Access Control (OAC) is incorrect because OAC is primarily used to prevent your users from viewing your S3 files by simply using the direct S3 URL.

The option that says: Use Signed URLs and Signed Cookies in CloudFront to distribute the firmware update file is incorrect. Although this solution provides a way to authenticate the premium users for the private content, the process of authentication has a significant latency in comparison to the Lambda@Edge solution. In this option, you have to refactor your application (which is deployed to a specific AWS region) to either create and distribute signed URLs to authenticated users or to send Set-Cookie headers that set signed cookies on the viewers for authenticated users. This will cause the latency, which could have been improved if the authentication logic resides on CloudFront edge locations using Lambda@Edge.



References:

https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html

https://aws.amazon.com/lambda/edge/



Check out these Amazon CloudFront and AWS Lambda Cheat Sheets:

https://tutorialsdojo.com/amazon-cloudfront/

https://tutorialsdojo.com/aws-lambda/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q11",
    domain: "Domain - Development with AWS Services",
    text: `An application performs various workflows and processes long-running tasks that take a long time to complete. Users are complaining that the application is unresponsive since the workflow substantially increases the time it takes to complete a user request. The development team is looking for a managed solution that can handle background tasks efficiently, scale automatically, and integrate seamlessly with the existing application deployed on Elastic Beanstalk.

Which of the following is the BEST way to improve the performance of the application?`,
    answers: [
      "Spawn a worker process locally in the EC2 instances and process the tasks asynchronously.",
      "Use an Elastic Beanstalk worker environment to process the tasks asynchronously.",
      "Use a multicontainer docker environment in Elastic Beanstalk to process the long-running tasks asynchronously.",
      "Use an Amazon ECS Cluster with a Fargate launch type to process the tasks asynchronously.",
    ],
    correctAnswerIndex: 1,
    correctAnswerIndices: [1],
    isMultiSelect: false,
    explanation: `
Overall explanation
If your application performs operations or workflows that take a long time to complete, you can offload those tasks to a dedicated worker environment. Decoupling your web application front end from a process that performs blocking operations is a common way to ensure that your application stays responsive under load.

A long-running task is anything that substantially increases the time it takes to complete a request, such as processing images or videos, sending emails, or generating a ZIP archive. These operations can take only a second or two to complete, but a delay of a few seconds is a lot for a web request that would otherwise complete in less than 500 ms.

<image src='JB_Paper1_Q11.png' alt="Image" style="max-width:100%; height:auto;"/>

One option is to spawn a worker process locally, return success, and process the task asynchronously. This works if your instance can keep up with all of the tasks sent to it. Under high load, however, an instance can become overwhelmed with background tasks and become unresponsive to higher-priority requests. If individual users can generate multiple tasks, the increase in load might not correspond to an increase in users, making it hard to scale out your web server tier effectively.

To avoid running long-running tasks locally, you can use the AWS SDK for your programming language to send them to an Amazon Simple Queue Service (Amazon SQS) queue and run the process that performs them on a separate set of instances. You then design these worker instances to take items from the queue only when they have the capacity to run them, preventing them from becoming overwhelmed.

Elastic Beanstalk worker environments simplify this process by managing the Amazon SQS queue and running a daemon process on each instance that reads from the queue for you. When the daemon pulls an item from the queue, it sends an HTTP POST request locally to http://localhost/ on port 80 with the contents of the queue message in the body. All that your application needs to do is perform the long-running task in response to the POST. You can configure the daemon to post to a different path, use a MIME type other than application/JSON, connect to an existing queue, or customize connections (maximum concurrent requests), timeouts, and retries.

Hence, the best solution to meet the requirements of this scenario is to use an Elastic Beanstalk worker environment to process the tasks asynchronously.

Spawning a worker process locally in the EC2 instances then processing the tasks asynchronously is incorrect. Although this is a valid solution, it is not scalable and hence, it's not the best one. Under high load, an instance can become overwhelmed with background tasks and become unresponsive to higher priority requests. This makes it hard to scale out your web server tier effectively.

Using a multicontainer docker environment in Elastic Beanstalk to process the long-running tasks asynchronously is incorrect because this is primarily used to support multiple containers per Amazon EC2 instance with multicontainer Docker platform. This is not applicable when processing long-running tasks and it is not scalable since it's not using an SQS queue.

Using an Amazon ECS Cluster with a Fargate launch type to process the tasks asynchronously is incorrect because Fargate just allows you to run your containerized applications without the need to provision and manage the backend infrastructure.



References:

https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features-managing-env-tiers.html

https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker_ecs.html



Check out this AWS Elastic Beanstalk Cheat Sheet:

https://tutorialsdojo.com/aws-elastic-beanstalk/
      `,
    answerExplanations: [],
  },
  {
    id: "s13q1",
    domain: "",
    text: "",
    answers: ["", "", "", ""],
    correctAnswerIndex: 1,
    correctAnswerIndices: [1],
    isMultiSelect: false,
    explanation: `
      `,
    answerExplanations: [],
  },
  {
    id: "s13q1",
    domain: "",
    text: "",
    answers: ["", "", "", ""],
    correctAnswerIndex: 1,
    correctAnswerIndices: [1],
    isMultiSelect: false,
    explanation: `
      `,
    answerExplanations: [],
  },
];
