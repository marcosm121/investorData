import axios from "axios";

export class DolarAPI {
  private url = "https://dolarapi.com/v1/dolares";

  private async getData() {
    try {
      const data = await axios
        .get<dolarApiResponse[]>(this.url)
        .then(function (response) {
          return response.data;
        });
      // console.log(data);
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async getDolares(dolares: string[]) {
    try {
      let prices = await this.getData();
      let result: any = {};
      if (prices) {
        for (let dolar of dolares) {
          const aux = prices.find((item) => item.casa === dolar);
          if (aux) result[dolar] = (aux?.compra + aux?.venta) / 2;
        }
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

// export default new DolarAPI();

interface dolarApiResponse {
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
}
