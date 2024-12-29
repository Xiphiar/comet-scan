import axios from "axios";

const parseError = (error: any): string | undefined => {
  if (!error) return undefined;

    if (axios.isAxiosError(error)) {

      if (error.code === 'ETIMEDOUT') return 'API connection timed out.'
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') return 'API connection failed.'
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // console.log(error.response.data);
        // console.log(error.response.status);
        // console.log(error.response.headers);
        console.log('error.response', error.response)
        return error.response.data.message || error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        // console.log(error.request);
        
        console.log('error.request', error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        // console.log('Error', error.message);
        console.log('error', error)
        console.log('error.message', error.message)
        return error.message;
      }
    }

    //Else
    const stringError = error.toString();
    if (stringError.includes('User denied transaction signature')) return 'User denied transaction signature.';
    if (stringError !== '[object Object]') return stringError;
    else return JSON.stringify(error)
}
export default parseError;