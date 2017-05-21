module.exports = {
  port: 3000,

  //*************safe*************

  ssl: true,  // self-signed
  //   false, not ssl
  //   {key: 'someKeyFilePath', cert: 'somecertFilePath'}, 

  sslSelfSigned: {
    commonName: '192.168.56.102',
    CA: null, // will auto create
    //  {key: 'someKeyFilePath', cert: 'somecertFilePath'}, 
    caCertDownloadKey: 'abcdefg.ca.crt',
  }
}
//    wss: 'self-signed',