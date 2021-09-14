import React, { useState, memo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Container, Column, Row } from "@crypto-signals/layout";
import Input from "@crypto-signals/components/Input";
import Select from "@crypto-signals/components/Select";
import Button from "@crypto-signals/components/Button";
import {
  allowed_pairs,
  getFormattedDateStringFromUnixTime
} from "@crypto-signals/utils";
import qs from "querystring";

const defaults = {
  pair: "All",
  startDate: "",
  endDate: "",
  items: 25
};

const TableFilters = memo(
  ({ filters, loading }) => {
    const location = useLocation();
    const history = useHistory();

    const [selectedPair, setSelectedPair] = useState(
      filters.get("pair") ?? defaults.pair
    );
    const [startDate, setStartDate] = useState(
      filters.get("startDate")
        ? getFormattedDateStringFromUnixTime(+filters.get("startDate"))
        : defaults.startDate
    );
    const [endDate, setEndDate] = useState(
      filters.get("endDate")
        ? getFormattedDateStringFromUnixTime(+filters.get("endDate"))
        : defaults.endDate
    );
    const [itemsPerPage, setItemsPerPage] = useState(
      filters.get("items") ?? defaults.items
    );

    const onClickApply = () => {
      const data = {
        ...(selectedPair && {
          pair: selectedPair === "All" ? "" : selectedPair
        }),
        ...(!!startDate && {
          startDate: new Date(`${startDate} 00:00:00`).getTime()
        }),
        ...(!!endDate && {
          endDate: new Date(`${endDate} 23:59:59`).getTime()
        }),
        items: Number(itemsPerPage),
        page: 1
      };

      history.replace(`${location.pathname}?${qs.stringify(data)}`);
    };

    const onClickReset = () => {
      setSelectedPair(defaults.pair);
      setStartDate(defaults.startDate);
      setEndDate(defaults.endDate);
      setItemsPerPage(defaults.items);
      history.replace(`${location.pathname}`);
    };

    const handleOnChange = e => {
      const name = e.target.name;
      const value = e.target.value;

      switch (name) {
        case "pairs": {
          setSelectedPair(value);
          break;
        }
        case "items": {
          setItemsPerPage(value);
          break;
        }
        case "startDate": {
          setStartDate(value);
          break;
        }
        case "endDate": {
          setEndDate(value);
          break;
        }
        default: {
          return;
        }
      }
    };

    return (
      <Container>
        <Row>
          <Column>
            <Select
              label="Pair"
              name="pairs"
              id="pairs"
              onChange={handleOnChange}
              value={selectedPair}
              items={["All"]
                .concat(allowed_pairs)
                .map(v => ({ label: v, value: v }))}
              disabled={loading}
            />
          </Column>
          <Column>
            <Input
              label="Start Date"
              type="date"
              id="startDate"
              name="startDate"
              onChange={handleOnChange}
              value={startDate}
              max={endDate}
              disabled={loading}
            />
          </Column>
          <Column>
            <Input
              label="End Date"
              type="date"
              id="endDate"
              name="endDate"
              onChange={handleOnChange}
              value={endDate}
              min={startDate}
              max={new Date().toISOString().replace(/T.+/, "")}
              disabled={loading}
            />
          </Column>
          <Column>
            <Select
              label="Items Per Page"
              id="items"
              name="items"
              onChange={handleOnChange}
              value={itemsPerPage}
              items={[25, 50, 100].map(v => ({ label: v, value: v }))}
              disabled={loading}
            />
          </Column>
        </Row>
        <Row centered>
          <Column className="is-4-tablet">
            <div className="buttons">
              <Button
                className="is-link"
                onClick={onClickApply}
                text="Apply"
                disabled={loading}
              />
              <Button disabled={loading} onClick={onClickReset} text="Reset" />
            </div>
          </Column>
        </Row>
      </Container>
    );
  },
  (prev, next) =>
    prev.loading === next.loading &&
    JSON.stringify(prev.filters) === JSON.stringify(next.filters)
);

export default TableFilters;
