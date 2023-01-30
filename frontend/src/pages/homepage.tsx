import { Box } from "@chakra-ui/react";
import React from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import EnsProofCard from "../components/ENS/EnsProofCard";
import ENSNameResolver from "../components/ENS/ENSNameResolver";

const HomePage = () => {
  return (
    <Box py={2}>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Storage Variable Verification</Tab>
          <Tab>ENS Name Resolution</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <EnsProofCard />
          </TabPanel>
          <TabPanel>
            <ENSNameResolver />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default HomePage;
