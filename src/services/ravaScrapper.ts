import axios from "axios";

export class RavaScrapper {
  async getPrice(ticker: string) {
    const expresion = "ultimo&quot;:";
    try {
      const data = await axios
        .get("https://www.rava.com/perfil/" + ticker)
        .then(function (response) {
          let res = response.data.toString();
          let pos = res.search(expresion);
          res = res.substring(pos + 13, pos + 22);
          res = res.substring(0, res.search(","));
          return res;
        });
      return data;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getMany(tickers: string[]) {
    const expresion = "ultimo&quot;:";
    let prices: any = {};
    console.log(tickers);

    // Función para obtener el precio de un ticker
    const getPriceForTicker = async (ticker: string) => {
      const response = await axios.get("https://www.rava.com/perfil/" + ticker);
      let res = response.data.toString();
      let pos = res.search(expresion);
      res = res.substring(pos + 13, pos + 22);
      res = res.substring(0, res.search(","));
      return res;
    };

    // Utiliza Promise.all para hacer solicitudes concurrentes
    try {
      const promises = tickers.map(async (ticker) => {
        try {
          const data = await getPriceForTicker(ticker);
          prices[ticker] = data;
        } catch (error) {
          console.error(error);
        }
      });

      await Promise.all(promises);

      return prices;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

