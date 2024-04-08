const axios = require("axios");


const makeAxiosGetRequest = async (service_endpoint, headers) => {
    try {
        const config = {
            headers
        }
        const serviceReposne = await axios.get(service_endpoint, config);
        if (serviceReposne.data.error) {
            throw error;
        }
        return serviceReposne.data.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const makeAxiosDeleteRequest = async (service_endpoint, headers) => {
    try {
        const config = {
            headers
        }
        const serviceReposne = await axios.get(service_endpoint, config);
        if (serviceReposne.data.error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const makeAxiosPutRequest = async (service_endpoint, headers, body) => {
    try {
        const config = {
            headers
        }
        const serviceReposne = await axios.get(service_endpoint, config, body);
        if (serviceReposne.data.error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const makeAxiosPostRequest = async (service_endpoint, headers, body) => {
    try {
        const config = {
            headers
        }
        const serviceReposne = await axios.post(service_endpoint, config, body);
        if (serviceReposne.data.error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = {
    makeAxiosGetRequest,
    makeAxiosDeleteRequest,
    makeAxiosPutRequest,
    makeAxiosPostRequest
}