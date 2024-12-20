import { Coin } from "@cosmjs/proto-signing";
import Blocks from "../models/blocks";

export const queryDailyAverages = async (chainId: string) => {
    let result: any[] = await Blocks.aggregate([
        {
          $match : { chainId }
        },
        {
          $group : {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            averageTransactions: { $avg: "$transactionsCount" },
            averageGasUsed: { $avg: "$totalGasUsed" },
            maximumTransactions: { $max: "$transactionsCount" },
            maximumGasUsed: { $max: "$totalGasUsed" },
            totalTransactions: { $sum: "$transactionsCount" },
            totalFees: { $push: "$totalFees" },
            totalBlocks: { $sum: 1 },
            emptyBlocks: { $sum: { $cond: [{ $eq: ["$transactionsCount", 0] }, 1, 0] } },
            fullBlocks: { $sum: { $cond: [{ $gte: ["$totalGasUsed", 5_500_000] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            date: "$_id",
          }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $project: {_id: 0}
        }
    ])

    // each day's `totalFees` field is currently Array<Coin[]>, convert it into just Coin[] with one entry per denom
    result.forEach(dayStats => {
      const totalFeesMap = new Map<string, bigint>();

      dayStats.totalFees.forEach((coins: Coin[]) => {
        coins.forEach(coin => {
          const existingAmount = totalFeesMap.get(coin.denom) || 0n;
          totalFeesMap.set(coin.denom, existingAmount + BigInt(coin.amount));
        })
      })

      const totalFees: Coin[] = [];
      totalFeesMap.forEach((amount, denom) => {
          totalFees.push({
              amount: amount.toString(),
              denom,
          });
      })
      dayStats.totalFees = totalFees;

    })

    return result;
}