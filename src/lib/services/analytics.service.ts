// src/lib/services/analytics.service.ts
// Analytics Service - Dashboard stats, revenue, sales, top products

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

interface DashboardStats {
  revenue: {
    total: number;
    change: number; // percentage
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  products: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
}

interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get dashboard statistics with period-over-period comparison
   */
  async getDashboardStats(
    storeId: string,
    dateRange: DateRange
  ): Promise<DashboardStats> {
    const { from, to } = dateRange;
    const periodLength = to.getTime() - from.getTime();
    const previousFrom = new Date(from.getTime() - periodLength);
    const previousTo = from;

    // Current period stats
    const [currentRevenue, currentOrders, currentCustomers, currentProducts] = await Promise.all([
      this.getRevenueTotal(storeId, from, to),
      this.getOrdersCount(storeId, from, to),
      this.getCustomersCount(storeId, from, to),
      this.getProductsCount(storeId),
    ]);

    // Previous period stats for comparison
    const [previousRevenue, previousOrders, previousCustomers] = await Promise.all([
      this.getRevenueTotal(storeId, previousFrom, previousTo),
      this.getOrdersCount(storeId, previousFrom, previousTo),
      this.getCustomersCount(storeId, previousFrom, previousTo),
    ]);

    return {
      revenue: {
        total: currentRevenue,
        change: this.calculateChange(currentRevenue, previousRevenue),
        trend: currentRevenue >= previousRevenue ? 'up' : 'down',
      },
      orders: {
        total: currentOrders,
        change: this.calculateChange(currentOrders, previousOrders),
        trend: currentOrders >= previousOrders ? 'up' : 'down',
      },
      customers: {
        total: currentCustomers,
        change: this.calculateChange(currentCustomers, previousCustomers),
        trend: currentCustomers >= previousCustomers ? 'up' : 'down',
      },
      products: {
        total: currentProducts,
        change: 0, // Products don't have period comparison
        trend: 'up',
      },
    };
  }

  /**
   * Get sales report with daily aggregations
   */
  async getSalesReport(
    storeId: string,
    dateRange: DateRange
  ): Promise<SalesDataPoint[]> {
    const { from, to } = dateRange;

    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: from,
          lte: to,
        },
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        deletedAt: null,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date
    const dataByDate = new Map<string, { sales: number; orders: number }>();

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dataByDate.get(date) || { sales: 0, orders: 0 };
      
      dataByDate.set(date, {
        sales: existing.sales + Number(order.totalAmount),
        orders: existing.orders + 1,
      });
    });

    // Convert to array and sort by date
    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get revenue report with daily aggregations
   */
  async getRevenueReport(
    storeId: string,
    dateRange: DateRange
  ): Promise<RevenueDataPoint[]> {
    const { from, to } = dateRange;

    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: from,
          lte: to,
        },
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        deletedAt: null,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date
    const dataByDate = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = dataByDate.get(date) || { revenue: 0, orders: 0 };
      
      dataByDate.set(date, {
        revenue: existing.revenue + Number(order.totalAmount),
        orders: existing.orders + 1,
      });
    });

    // Convert to array and sort by date
    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top selling products
   */
  async getTopProducts(
    storeId: string,
    limit: number = 10
  ): Promise<TopProduct[]> {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          status: {
            in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
          },
          deletedAt: null,
        },
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = orderItems.map((item) => item.productId).filter((id): id is string => id !== null);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return orderItems
      .map((item) => {
        if (!item.productId) return null;
        const product = productMap.get(item.productId);
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          sales: item._sum?.quantity || 0,
          revenue: Number(item._sum?.totalAmount || 0),
          orders: item._count?._all || 0,
        };
      })
      .filter((item): item is TopProduct => item !== null);
  }

  /**
   * Get customer metrics and analytics
   */
  async getCustomerMetrics(
    storeId: string,
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { startDate, endDate } = dateRange;

    // Get all customers for the store
    const totalCustomers = await prisma.customer.count({
      where: {
        storeId,
        deletedAt: null,
      },
    });

    // Get new customers in the period
    const newCustomers = await prisma.customer.count({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    });

    // Get customers who made orders in this period
    const customersWithOrders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    });

    const customerIdsInPeriod = customersWithOrders
      .map(o => o.customerId)
      .filter((id): id is string => id !== null);

    // Get returning customers (those who had orders before this period)
    let returningCustomers = 0;
    if (customerIdsInPeriod.length > 0) {
      const customersWithPreviousOrders = await prisma.order.findMany({
        where: {
          storeId,
          customerId: {
            in: customerIdsInPeriod,
          },
          createdAt: {
            lt: startDate,
          },
          deletedAt: null,
        },
        select: {
          customerId: true,
        },
        distinct: ['customerId'],
      });
      returningCustomers = customersWithPreviousOrders.length;
    }

    // Calculate retention rate (returning customers / customers from previous period)
    const previousPeriodCustomers = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          lt: startDate,
        },
        deletedAt: null,
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    });

    const customerRetentionRate = previousPeriodCustomers.length > 0
      ? (returningCustomers / previousPeriodCustomers.length) * 100
      : 0;

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
    };
  }

  /**
   * Get total revenue for a period
   */
  private async getRevenueTotal(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        storeId,
        createdAt: {
          gte: from,
          lte: to,
        },
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        deletedAt: null,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return Number(result._sum?.totalAmount || 0);
  }

  /**
   * Get orders count for a period
   */
  private async getOrdersCount(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    return prisma.order.count({
      where: {
        storeId,
        createdAt: {
          gte: from,
          lte: to,
        },
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        deletedAt: null,
      },
    });
  }

  /**
   * Get customers count for a period
   */
  private async getCustomersCount(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<number> {
    const customers = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: from,
          lte: to,
        },
        deletedAt: null,
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    });

    return customers.length;
  }

  /**
   * Get total products count
   */
  private async getProductsCount(storeId: string): Promise<number> {
    return prisma.product.count({
      where: {
        storeId,
        deletedAt: null,
      },
    });
  }

  /**
   * Calculate percentage change
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
