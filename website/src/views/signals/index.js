import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import { useLocation, useHistory } from "react-router-dom";
import { http } from "@crypto-signals/utils";
import Table from "@crypto-signals/components/Table";
import TableFilters from "@crypto-signals/components/Table/Filters";
import Pagination from "@crypto-signals/components/Pagination";
// import Notification from "@crypto-signals/components/Notification";
import Block from "@crypto-signals/components/Block";
import Loading from "@crypto-signals/components/Loading";
import RetryMessage from "@crypto-signals/components/RetryMessage";
import qs from "querystring";
import columns from "./columns";
import { allowed_pairs } from "../../utils";

const FILTERS_DEFAULTS = {
  limit: 25,
  page: 1,
  symbol: "",
  start_time: null,
  end_time: null
};

const Signals = () => {
  const location = useLocation();
  const history = useHistory();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [signals, setSignals] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState(false);
  const tableRef = useRef();

  const onClickPage = useCallback(
    page => {
      let currentParams = {};
      for (const [key, value] of params.entries()) {
        currentParams[key] = value;
      }
      currentParams["page"] = page;
      history.replace(`${location.pathname}?${qs.stringify(currentParams)}`);
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth" });
      }
    },
    [params, location.pathname, history]
  );

  const getSignals = useCallback(async () => {
    try {
      const paramsPage = params.get("page");
      if (+paramsPage <= 0) {
        return onClickPage(1);
      }
      setLoading(v => (v ? v : true));
      setErrorLoading(v => (!v ? v : false));
      setSignals(v => (Array.isArray(v) && !v.length ? v : []));

      const page = paramsPage ?? FILTERS_DEFAULTS.page;
      const limit = params.get("items") ?? FILTERS_DEFAULTS.limit;
      let symbol = params.get("pair") ?? FILTERS_DEFAULTS.symbol;
      const validSymbol =
        allowed_pairs.indexOf(String(symbol).toUpperCase()) !== -1;
      const queryObject = {
        ...(validSymbol && { symbol }),
        start_time: params.get("startDate") ?? FILTERS_DEFAULTS.start_time,
        end_time: params.get("endDate") ?? FILTERS_DEFAULTS.end_time,
        limit,
        ...(page > 1 && { offset: page * limit - limit })
      };
      const query = qs.stringify(
        Object.keys(queryObject).reduce(
          (acc, key) =>
            !!queryObject[key] ? { ...acc, [key]: queryObject[key] } : acc,
          {}
        )
      );
      const { data, headers } = await http.get(`/signals?${query}`);
      const count = Number(headers["x-total-count"]);
      setTotalItems(count);
      setSignals(data);
    } catch (error) {
      console.error(error);
      setErrorLoading(true);
    }
    /**
     * setLoading(false) was used before inside a "finally" but it would trigger even when returning due to "+paramsPage <= 0"
     */
    setLoading(false);
  }, [params, onClickPage]);

  useEffect(() => {
    getSignals();
  }, [getSignals]);

  const currentPage =
    params.get("page") > 0 ? +params.get("page") : FILTERS_DEFAULTS.page;
  const itemsPerPage = params.get("items") ?? FILTERS_DEFAULTS.limit;

  console.log("RENDER!");
  return (
    <>
      {/* <Notification /> */}
      <Block>
        <div className="box">
          <Block>
            <TableFilters filters={params} loading={loading} />
          </Block>
          {loading && <Loading />}
          {!loading && errorLoading && <RetryMessage retry={getSignals} />}
          {!loading && !errorLoading && (
            <div ref={tableRef}>
              <Table columns={columns} data={signals} />
              <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onClickPage={onClickPage}
              />
            </div>
          )}
        </div>
      </Block>
    </>
  );
};

export default Signals;
