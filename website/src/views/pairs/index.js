import React, { useState, useEffect } from "react";
import { http } from "@crypto-signals/utils";
import Box from "@crypto-signals/components/Box";
import Loading from "@crypto-signals/components/Loading";
import Block from "@crypto-signals/components/Block";

const Coins = () => {
  const [pairs, setPairs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const getPairs = async () => {
      try {
        setLoading(v => (v ? v : true));
        const { data } = await http.get("/markets/active");
        setPairs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getPairs();
  }, []);

  const onChange = ({ target: { value } }) => {
    setSearchTerm(value);
  };

  const filteredPairs = (pairs || []).filter(v =>
    v.match(new RegExp(String(searchTerm).toUpperCase()))
  );

  return (
    <Box>
      <div className="content is-normal">
        <h3>Currently tracked market pairs</h3>
        {loading && !pairs && <Loading />}
        {pairs && (
          <>
            <Block>
              <input
                className="input"
                style={{ maxWidth: 240 }}
                type="text"
                placeholder="Search"
                onChange={onChange}
                value={searchTerm}
              />
            </Block>
            <Block>
              <table>
                <thead>
                  <tr>
                    <th>Pair</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPairs.map(pair => (
                    <tr key={`pair-${pair}`}>
                      <td>{pair}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Block>
          </>
        )}
      </div>
    </Box>
  );
};

export default Coins;
