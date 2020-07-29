import React, { Component } from 'react';
import { Table, Pagination, Icon } from '@alifd/next';

import { messageError } from '@/utils/message';
import { PIPELINE_MAP, JOB_MAP, PIPELINE_STATUS } from '@/utils/config';
import { get } from '@/utils/request';

import './index.scss';

const PAGE_SIZE = 30; // number of records in one page

export default class Pipeline extends Component {

  state = {
    models: [],
    fields: PIPELINE_MAP, // pipeline or job,
    currentPage: 1,
    totalCount: 0,
    sort: {
      createdAt: 'desc',
    },
  }

  changePage = async (value) => {
    await this.fetchData(value);
  }

  fetchData = async (currentPage) => {
    // check if show job or pipeline from url
    let queryUrl = '/pipeline/list';
    if (location.href.includes('jobs')) {
      this.setState({
        fields: JOB_MAP,
      });
      queryUrl = '/job/list';
    }
    
    try {
      const response = await get(queryUrl, {
        params: {
          offset: (currentPage - 1) * PAGE_SIZE, 
          limit: PAGE_SIZE,
          order: {
            createdAt: ''
          }
        },
      });
      const result = response.rows.map((item) => {
        return {
          ...item,
          status: PIPELINE_STATUS[item.status],
        };
      });
      this.setState({
        models: this.getSortedData(result, this.state.sort.createdAt),
        totalCount: response.count,
        currentPage,
      });
    } catch (err) {
      messageError(err.message);
    }
  }

  getSortedData = (data, order) => {
    data.sort((a, b) => {
      const res = new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
      return (order === 'asc') ? (res > 0 ? 1 : -1) : (res > 0 ? -1 : 1);
    });
    return data;
  }

  onSort = (dataIndex, order) => {
    if (dataIndex !== 'createdAt') return;
    this.setState((prevState) => {
      return {
        models: this.getSortedData([ ...prevState.models ], order),
        sort: {
          [dataIndex]: order
        },
      };
    });
  }

  componentDidMount = async () => {
    await this.fetchData(1);
  }

  render() {
    const { models, fields, sort, currentPage, totalCount } = this.state;
    return (
      <div className="pipeline">
        <Table dataSource={models}
          hasBorder={false}
          stickyHeader
          sort={sort}
          onSort={this.onSort}
          offsetTop={45}>
          {
            fields.map(field => <Table.Column 
              key={field.name}
              title={field.name}
              dataIndex={field.field}
              cell={field.cell}
              sortable={field.sortable || false}
              width={field.width}
              align="center"
            />)
          }
        </Table>
        <Pagination 
          current={currentPage} 
          total={totalCount} 
          pageSize={PAGE_SIZE} 
          type="simple"
          className="pagination-wrapper" 
          onChange={this.changePage}
        />
        <div className="pipeline-create-container" onClick={() => location.href = 'index.html#/pipeline/info'}>
          <Icon className="pipeline-create" type="add" size="large" />
        </div>
      </div>
    );
  }
  
}
