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
      // console.log("pegando a ticker: " + ticker);
      const response = await axios.get("https://www.rava.com/perfil/" + ticker);
      const res = response.data.toString();
      let pos;
      let price;
      // Calculo ultimo precio
      const lastPos = res.lastIndexOf(expresion);
      if (lastPos === -1) return "0";
      let lastPrice = res.substring(lastPos + 13, lastPos + 22);
      lastPrice = lastPrice.substring(0, lastPrice.search(","));
      // Calculo penultimo precio
      const secondLastPos = res.lastIndexOf(expresion, lastPos - 1);
      if (secondLastPos === -1) return lastPrice;
      let secondLastPrice = res.substring(
        secondLastPos + 13,
        secondLastPos + 22
      );
      secondLastPrice = secondLastPrice.substring(
        0,
        secondLastPrice.search(",")
      );
      // Comparo precios
      if (secondLastPrice == "0") return lastPrice;
      return secondLastPrice;
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
